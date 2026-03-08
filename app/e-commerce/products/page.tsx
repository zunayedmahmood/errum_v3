'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Filter, Loader2, ShoppingBag } from 'lucide-react';

import Navigation from '@/components/ecommerce/Navigation';
import CartSidebar from '@/components/ecommerce/cart/CartSidebar';
import catalogService, {
  CatalogCategory,
  GetProductsParams,
  PaginationMeta,
  SimpleProduct,
} from '@/services/catalogService';
import SlugStyleProductCard from '@/components/ecommerce/ui/SlugStyleProductCard';

import {
  buildCardProductsFromResponse,
  getCardNewestSortKey,
} from '@/lib/ecommerceCardUtils';

type ProductSort = NonNullable<GetProductsParams['sort_by']>;

type FlatCategory = CatalogCategory & { depth: number };

const PRODUCTS_PER_PAGE = 100;
const BACKEND_BATCH_SIZE = 100;

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase();

const flattenCategories = (nodes: CatalogCategory[], depth = 0): FlatCategory[] => {
  const out: FlatCategory[] = [];
  for (const node of nodes) {
    out.push({ ...node, depth });
    if (Array.isArray(node.children) && node.children.length > 0) {
      out.push(...flattenCategories(node.children, depth + 1));
    }
  }
  return out;
};

const collectCategoryScope = (selectedId: string, flatCategories: FlatCategory[]) => {
  const id = Number(selectedId);
  if (!id) {
    return {
      ids: new Set<number>(),
      names: new Set<string>(),
      slugs: new Set<string>(),
    };
  }

  const ids = new Set<number>();
  const names = new Set<string>();
  const slugs = new Set<string>();
  const queue = [id];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (ids.has(current)) continue;
    ids.add(current);

    const currentNode = flatCategories.find((category) => Number(category.id) === current);
    if (currentNode) {
      if (currentNode.name) names.add(normalize(currentNode.name));
      if (currentNode.slug) slugs.add(normalize(currentNode.slug));
    }

    flatCategories
      .filter((category) => Number(category.parent_id) === current)
      .forEach((child) => {
        if (!ids.has(Number(child.id))) {
          queue.push(Number(child.id));
        }
      });
  }

  return { ids, names, slugs };
};

const getProductCategoryMeta = (product: SimpleProduct) => {
  const category = (product as any)?.category;
  if (!category) {
    return { id: 0, name: '', slug: '' };
  }

  if (typeof category === 'string') {
    return { id: 0, name: category, slug: '' };
  }

  return {
    id: Number(category.id) || 0,
    name: String(category.name || ''),
    slug: String(category.slug || ''),
  };
};

const matchesSelectedCategory = (
  product: SimpleProduct,
  selectedCategory: string,
  flatCategories: FlatCategory[]
) => {
  if (selectedCategory === 'all') return true;

  const scope = collectCategoryScope(selectedCategory, flatCategories);
  const productCategory = getProductCategoryMeta(product);

  if (productCategory.id && scope.ids.has(productCategory.id)) return true;
  if (productCategory.name && scope.names.has(normalize(productCategory.name))) return true;
  if (productCategory.slug && scope.slugs.has(normalize(productCategory.slug))) return true;

  return false;
};

const matchesSearchTerm = (product: SimpleProduct, rawQuery: string) => {
  const query = normalize(rawQuery);
  if (!query) return true;

  const category = getProductCategoryMeta(product);
  const variants = Array.isArray((product as any)?.variants) ? (product as any).variants : [];
  const variantBits = variants.flatMap((variant: any) => [
    variant?.display_name,
    variant?.base_name,
    variant?.name,
    variant?.sku,
    variant?.variation_suffix,
    variant?.option_label,
  ]);

  const haystack = [
    (product as any)?.display_name,
    (product as any)?.base_name,
    product?.name,
    product?.sku,
    category.name,
    category.slug,
    ...variantBits,
  ]
    .map((item) => normalize(item))
    .filter(Boolean)
    .join(' ');

  const tokens = query.split(/\s+/).filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
};

const sortProducts = (items: SimpleProduct[], sortBy: ProductSort) => {
  const out = [...items];

  out.sort((a, b) => {
    if (sortBy === 'newest') {
      return getCardNewestSortKey(b) - getCardNewestSortKey(a);
    }

    if (sortBy === 'name') {
      const aName = normalize((a as any)?.display_name || (a as any)?.base_name || a?.name);
      const bName = normalize((b as any)?.display_name || (b as any)?.base_name || b?.name);
      return aName.localeCompare(bName);
    }

    if (sortBy === 'price_asc' || sortBy === 'price_desc') {
      const getComparablePrice = (product: SimpleProduct) => {
        const variants = Array.isArray((product as any)?.variants) ? (product as any).variants : [];
        const prices = [product, ...variants]
          .map((item: any) => Number(item?.selling_price) || 0)
          .filter((price: number) => price > 0);

        if (prices.length === 0) return 0;
        return Math.min(...prices);
      };

      const aPrice = getComparablePrice(a);
      const bPrice = getComparablePrice(b);
      return sortBy === 'price_asc' ? aPrice - bPrice : bPrice - aPrice;
    }

    return 0;
  });

  return out;
};

const buildLocalPagination = (totalItems: number, currentPage: number): PaginationMeta => ({
  current_page: currentPage,
  per_page: PRODUCTS_PER_PAGE,
  total: totalItems,
  last_page: Math.max(1, Math.ceil(totalItems / PRODUCTS_PER_PAGE)),
  has_more_pages: currentPage < Math.max(1, Math.ceil(totalItems / PRODUCTS_PER_PAGE)),
});

const dedupeById = (products: SimpleProduct[]) => {
  const seen = new Set<number>();
  const out: SimpleProduct[] = [];

  for (const product of products) {
    const id = Number((product as any)?.id) || 0;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(product);
  }

  return out;
};

export default function ProductsPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<ProductSort>('newest');
  const [isLoading, setIsLoading] = useState(false);
  const [isHydratingMatches, setIsHydratingMatches] = useState(false);

  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<SimpleProduct[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const directRequestRef = useRef(0);
  const filteredRequestRef = useRef(0);

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
  const hasActiveFilters = selectedCategory !== 'all' || Boolean(debouncedSearchTerm.trim());
  const filterSignature = `${selectedCategory}|${normalize(debouncedSearchTerm)}|${sortBy}`;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, debouncedSearchTerm, sortBy]);

  useEffect(() => {
    if (!hasActiveFilters) {
      setFilteredProducts([]);
      setIsHydratingMatches(false);
      return;
    }

    let isAlive = true;
    const requestId = ++filteredRequestRef.current;

    const loadFilteredProducts = async () => {
      setIsLoading(true);
      setIsHydratingMatches(false);
      setProducts([]);
      setFilteredProducts([]);
      setPagination(null);

      const matchedProducts: SimpleProduct[] = [];
      const matchedIds = new Set<number>();

      const pushMatches = (incoming: SimpleProduct[]) => {
        let didAdd = false;

        for (const product of incoming) {
          const productId = Number((product as any)?.id) || 0;
          if (!productId || matchedIds.has(productId)) continue;
          if (!matchesSelectedCategory(product, selectedCategory, flatCategories)) continue;
          if (!matchesSearchTerm(product, debouncedSearchTerm)) continue;

          matchedIds.add(productId);
          matchedProducts.push(product);
          didAdd = true;
        }

        if (!didAdd) return;

        const sorted = sortProducts(dedupeById(matchedProducts), sortBy);
        if (!isAlive || filteredRequestRef.current !== requestId) return;

        setFilteredProducts(sorted);
        setPagination(buildLocalPagination(sorted.length, 1));

        if (currentPage === 1) {
          setProducts(sorted.slice(0, PRODUCTS_PER_PAGE));
        }

        setIsLoading(false);
      };

      const quickParams: GetProductsParams = {
        page: 1,
        per_page: Math.max(PRODUCTS_PER_PAGE, 40),
        sort_by: sortBy,
        _suppressErrorLog: true,
      };

      if (selectedCategory !== 'all') {
        const selected = flatCategories.find((category) => String(category.id) === String(selectedCategory));
        quickParams.category_id = Number(selectedCategory);
        if (selected?.name) quickParams.category = selected.name;
        if (selected?.slug) quickParams.category_slug = selected.slug;
      }

      if (debouncedSearchTerm) {
        quickParams.search = debouncedSearchTerm;
      }

      try {
        const quickResponse = await catalogService.getProducts(quickParams);
        pushMatches(buildCardProductsFromResponse(quickResponse));
      } catch {
        // Silent on purpose — full backend scan below guarantees coverage.
      }

      if (!isAlive || filteredRequestRef.current !== requestId) return;
      setIsHydratingMatches(true);

      try {
        let backendPage = 1;
        let backendLastPage = 1;

        do {
          const response = await catalogService.getProducts({
            page: backendPage,
            per_page: BACKEND_BATCH_SIZE,
            sort_by: sortBy === 'newest' ? 'newest' : undefined,
            _suppressErrorLog: backendPage > 1,
          });

          if (!isAlive || filteredRequestRef.current !== requestId) return;

          backendLastPage = Math.max(backendLastPage, Number(response.pagination?.last_page) || 1);
          pushMatches(buildCardProductsFromResponse(response));
          backendPage += 1;
        } while (backendPage <= backendLastPage);

        if (!isAlive || filteredRequestRef.current !== requestId) return;

        const finalSorted = sortProducts(dedupeById(matchedProducts), sortBy);
        setFilteredProducts(finalSorted);
        setPagination(buildLocalPagination(finalSorted.length, 1));
        setIsLoading(false);
        setIsHydratingMatches(false);
      } catch (error) {
        console.error('Error scanning filtered products:', error);
        if (!isAlive || filteredRequestRef.current !== requestId) return;
        setFilteredProducts([]);
        setProducts([]);
        setPagination(buildLocalPagination(0, 1));
        setIsLoading(false);
        setIsHydratingMatches(false);
      }
    };

    loadFilteredProducts();

    return () => {
      isAlive = false;
    };
  }, [filterSignature, hasActiveFilters, flatCategories, selectedCategory, debouncedSearchTerm, sortBy]);

  useEffect(() => {
    if (!hasActiveFilters) return;

    const sorted = sortProducts(filteredProducts, sortBy);
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const end = start + PRODUCTS_PER_PAGE;

    setProducts(sorted.slice(start, end));
    setPagination(buildLocalPagination(sorted.length, currentPage));
  }, [filteredProducts, currentPage, hasActiveFilters, sortBy]);

  useEffect(() => {
    if (hasActiveFilters) return;

    let isAlive = true;
    const requestId = ++directRequestRef.current;

    const fetchProducts = async () => {
      setIsLoading(true);
      setIsHydratingMatches(false);
      try {
        const response = await catalogService.getProducts({
          page: currentPage,
          per_page: PRODUCTS_PER_PAGE,
          sort_by: sortBy,
        });

        if (!isAlive || directRequestRef.current !== requestId) return;

        const cards = sortProducts(buildCardProductsFromResponse(response), sortBy);
        setProducts(cards);
        setPagination(response.pagination);
      } catch (error) {
        console.error('Error fetching products:', error);
        if (!isAlive || directRequestRef.current !== requestId) return;
        setProducts([]);
        setPagination(buildLocalPagination(0, 1));
      } finally {
        if (!isAlive || directRequestRef.current !== requestId) return;
        setIsLoading(false);
      }
    };

    fetchProducts();

    return () => {
      isAlive = false;
    };
  }, [currentPage, sortBy, hasActiveFilters]);

  const fetchCategories = async () => {
    try {
      const categoryData = await catalogService.getCategories();
      setCategories(categoryData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getPageWindow = (current: number, last: number) => {
    const pages: Array<number | '…'> = [];
    if (last <= 7) {
      for (let i = 1; i <= last; i++) pages.push(i);
      return pages;
    }

    const push = (value: number | '…') => pages.push(value);
    push(1);

    const left = Math.max(2, current - 1);
    const right = Math.min(last - 1, current + 1);

    if (left > 2) push('…');
    for (let i = left; i <= right; i++) push(i);
    if (right < last - 1) push('…');

    push(last);
    return pages;
  };

  const markImageError = (id: number) => {
    setImageErrors((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };



  const navigateToProduct = (identifier: number | string) => {
    router.push(`/e-commerce/product/${identifier}`);
  };

  return (
    <>
      <div className="ec-root ec-darkify min-h-screen">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">All Products</h1>
            <p className="text-white/70">Browse our complete collection</p>
          </div>

          <div className="mb-8">
            <div className="md:hidden flex gap-3">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/15"
              />

              <button
                type="button"
                onClick={() => setIsFiltersOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] text-white"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>

            <div className="hidden md:block ec-dark-card p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/15"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="ecom-select w-full pl-10 pr-9 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-white/15 appearance-none"
                  >
                    <option value="all">All Categories</option>
                    {flatCategories.map((category) => (
                      <option key={category.id} value={category.id.toString()}>
                        {`${'— '.repeat(category.depth)}${category.name}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as ProductSort)}
                    className="w-full pl-4 pr-9 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-white/15 appearance-none"
                  >
                    <option value="newest">Newest</option>
                    <option value="name">Name</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
                </div>
              </div>
            </div>

            {isFiltersOpen && (
              <div className="fixed inset-0 z-[60]">
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setIsFiltersOpen(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm ec-dark-card border-l border-white/10 p-5 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-white font-semibold text-lg">Filters</div>
                    <button
                      type="button"
                      onClick={() => setIsFiltersOpen(false)}
                      className="px-3 py-2 rounded-lg border border-white/10 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.10)] text-white"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <div className="text-sm text-white/70 mb-2">Category</div>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-white/15"
                      >
                        <option value="all">All Categories</option>
                        {flatCategories.map((category) => (
                          <option key={category.id} value={category.id.toString()}>
                            {`${'— '.repeat(category.depth)}${category.name}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="text-sm text-white/70 mb-2">Sort</div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { v: 'newest', label: 'Newest' },
                          { v: 'name', label: 'Name' },
                          { v: 'price_asc', label: 'Low → High' },
                          { v: 'price_desc', label: 'High → Low' },
                        ].map((opt) => (
                          <button
                            key={opt.v}
                            type="button"
                            onClick={() => setSortBy(opt.v as ProductSort)}
                            className={[
                              'px-3 py-3 rounded-xl border text-sm',
                              sortBy === opt.v ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 bg-white/5 text-white/80',
                            ].join(' ')}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFiltersOpen(false)}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] text-white font-medium"
                    >
                      Show Products
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {isHydratingMatches && products.length > 0 && (
            <div className="mb-4 flex items-center justify-center gap-2 text-sm text-white/65">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading more matching products from the catalogue…
            </div>
          )}

          {isLoading && products.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900" />
              <p className="mt-4 text-white/70">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
              <p className="text-white/70">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <SlugStyleProductCard
                  key={product.id}
                  product={product}
                  imageErrored={imageErrors.has(Number(product.id))}
                  onImageError={(id) => markImageError(Number(id))}
                  onViewProduct={(id) => navigateToProduct(id)}
                />
              ))}
            </div>
          )}

          {pagination && pagination.last_page > 1 && (
            <div className="mt-8">
              <div className="text-center text-sm text-white/70 mb-3">
                Page {pagination.current_page} of {pagination.last_page}
              </div>

              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={pagination.current_page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/90 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                >
                  Prev
                </button>

                {getPageWindow(pagination.current_page, pagination.last_page).map((pageNumber, idx) =>
                  pageNumber === '…' ? (
                    <span key={`dots-${idx}`} className="px-2 text-white/50">
                      …
                    </span>
                  ) : (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={[
                        'min-w-10 px-3 py-2 rounded-lg border text-sm',
                        pageNumber === pagination.current_page
                          ? 'border-white/30 bg-white/10 text-white'
                          : 'border-white/10 bg-white/5 text-white/85 hover:bg-white/10',
                      ].join(' ')}
                    >
                      {pageNumber}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={pagination.current_page >= pagination.last_page}
                  onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                  className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/90 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
