import { Injectable, NotFoundException } from '@nestjs/common';
import { formatPhoneNumber } from 'src/common/utils/phone.util';
import { PrismaService } from 'src/prisma/prisma.service';

const MAX_LOOKUP_ADDRESSES = 5;
const LOOKUP_PHONE_TAIL_LENGTH = 10;

const getPhoneDigits = (phone: string): string => phone.replace(/\D/g, '');

const getPhoneLookupKey = (phone: string): string => {
  const digits = getPhoneDigits(phone);
  if (digits.length <= LOOKUP_PHONE_TAIL_LENGTH) {
    return digits;
  }

  return digits.slice(-LOOKUP_PHONE_TAIL_LENGTH);
};

type LookupCustomerAddress = {
  id: number;
  address: string;
  label: string | null;
  usageCount: number;
  lastUsedAt: Date;
};

type LookupCustomerCandidate = {
  id: number;
  phone: string;
  name: string | null;
  addresses: LookupCustomerAddress[];
};

type LookupAddressResult = {
  id: string;
  address: string;
  label?: string;
  usageCount: number;
  lastUsedAt: string;
};

const mapAddressResult = (
  address: LookupCustomerAddress,
): LookupAddressResult => ({
  id: String(address.id),
  address: address.address.trim(),
  label: address.label || undefined,
  usageCount: address.usageCount,
  lastUsedAt: address.lastUsedAt.toISOString(),
});

const sortAddressesByRecentUse = (
  firstAddress: LookupAddressResult,
  secondAddress: LookupAddressResult,
) =>
  new Date(secondAddress.lastUsedAt).getTime() -
  new Date(firstAddress.lastUsedAt).getTime();

/** Provides public restaurant brand, branch, menu, and delivery read APIs. */
@Injectable()
export class RestaurantService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns static brand metadata for the storefront. */
  getBrand() {
    return {
      nameAr: 'المخبر اللبناني',
      nameEn: 'The Lebanese Bakery',
    };
  }

  /** Lists active synced branches. */
  findBranches() {
    return this.prisma.branch.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  /** Returns the shared menu grouped by category for a branch. */
  async findMenu(branchId: number) {
    await this.assertBranchExists(branchId);
    return this.prisma.menuCategory.findMany({
      where: { deletedAt: null, items: { some: { isActive: true } } },
      include: {
        items: {
          where: { isActive: true, deletedAt: null },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Lists delivery services available for a branch. */
  async findDeliveryServices(branchId: number) {
    await this.assertBranchExists(branchId);
    return this.prisma.deliveryService.findMany({
      where: { branchId, isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  /** Looks up recent customer details and saved addresses by phone. */
  async lookupCustomerByPhone(branchId: number, phone: string) {
    await this.assertBranchExists(branchId);

    const rawPhone = phone.trim();
    if (!rawPhone) {
      return { phone: '', addresses: [] };
    }

    const cleanedPhone = rawPhone.replace(/[^\d+]/g, '');
    const formattedPhone = formatPhoneNumber(rawPhone);
    const formattedPhoneWithoutPlus = formattedPhone.replace(/^\+/, '');
    const lookupKey = getPhoneLookupKey(rawPhone);

    const customerCandidates = await this.prisma.customer.findMany({
      where: {
        OR: [
          { phone: formattedPhone },
          { phone: formattedPhoneWithoutPlus },
          { phoneRaw: rawPhone },
          { phoneRaw: cleanedPhone },
          ...(lookupKey.length >= LOOKUP_PHONE_TAIL_LENGTH
            ? [
                { phone: { contains: lookupKey } },
                { phoneRaw: { contains: lookupKey } },
              ]
            : []),
        ],
      },
      include: {
        addresses: {
          orderBy: [{ lastUsedAt: 'desc' }, { usageCount: 'desc' }],
          take: MAX_LOOKUP_ADDRESSES,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    const matchingCustomers = customerCandidates.filter(
      (customer) => getPhoneLookupKey(customer.phone) === lookupKey,
    );
    const customerLookupResult =
      this.buildCustomerLookupResult(matchingCustomers);

    if (customerLookupResult) {
      return customerLookupResult;
    }

    const phoneCandidates = Array.from(
      new Set(
        [
          rawPhone,
          cleanedPhone,
          formattedPhone,
          formattedPhoneWithoutPlus,
        ].filter((value) => value.length > 0),
      ),
    );

    let orders = await this.prisma.mvpOrder.findMany({
      where: {
        branchId,
        OR: [
          { customerMobile: { in: phoneCandidates } },
          ...(lookupKey.length >= LOOKUP_PHONE_TAIL_LENGTH
            ? [{ customerMobile: { contains: lookupKey } }]
            : []),
        ],
      },
      select: {
        customerName: true,
        customerMobile: true,
        customerAddress: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    let matchingOrders = orders.filter(
      (order) => getPhoneLookupKey(order.customerMobile) === lookupKey,
    );

    if (matchingOrders.length === 0) {
      orders = await this.prisma.mvpOrder.findMany({
        where: { branchId },
        select: {
          customerName: true,
          customerMobile: true,
          customerAddress: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      matchingOrders = orders.filter(
        (order) => getPhoneLookupKey(order.customerMobile) === lookupKey,
      );
    }

    const newestOrder = matchingOrders[0];
    const addressesByText = new Map<
      string,
      { id: string; address: string; lastUsedAt: string }
    >();

    for (const order of matchingOrders) {
      const address = order.customerAddress.trim();
      const addressKey = address.toLowerCase();
      if (!address || addressesByText.has(addressKey)) {
        continue;
      }

      addressesByText.set(addressKey, {
        id: String(addressesByText.size + 1),
        address,
        lastUsedAt: order.createdAt.toISOString(),
      });
    }

    return {
      name: newestOrder?.customerName.trim() || undefined,
      phone: newestOrder?.customerMobile.trim() || formattedPhone || rawPhone,
      addresses: Array.from(addressesByText.values()).slice(
        0,
        MAX_LOOKUP_ADDRESSES,
      ),
    };
  }

  /** Builds a deduped lookup response from matching customer records. */
  private buildCustomerLookupResult(customers: LookupCustomerCandidate[]) {
    if (customers.length === 0) {
      return null;
    }

    const newestCustomer = customers[0];
    const addressesByText = new Map<string, LookupAddressResult>();

    for (const customer of customers) {
      this.collectCustomerLookupAddresses(customer, addressesByText);
    }

    return {
      id: newestCustomer.id,
      name: newestCustomer.name?.trim() || undefined,
      phone: newestCustomer.phone,
      addresses: Array.from(addressesByText.values())
        .sort(sortAddressesByRecentUse)
        .slice(0, MAX_LOOKUP_ADDRESSES),
    };
  }

  /** Adds newer unique customer addresses to a lookup address map. */
  private collectCustomerLookupAddresses(
    customer: LookupCustomerCandidate,
    addressesByText: Map<string, LookupAddressResult>,
  ): void {
    for (const address of customer.addresses) {
      const nextAddress = mapAddressResult(address);
      if (!nextAddress.address) {
        continue;
      }

      const addressKey = nextAddress.address.toLowerCase();
      const currentAddress = addressesByText.get(addressKey);
      if (
        !currentAddress ||
        new Date(nextAddress.lastUsedAt) > new Date(currentAddress.lastUsedAt)
      ) {
        addressesByText.set(addressKey, nextAddress);
      }
    }
  }

  /** Throws when a branch is missing or inactive. */
  async assertBranchExists(branchId: number): Promise<void> {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!branch) {
      throw new NotFoundException(`Branch ${branchId} not found`);
    }
  }
}
