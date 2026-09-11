'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, Truck, Shield, RotateCcw, Check } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import ProductCard from '@/components/product/ProductCard';
import { trackViewItem, trackAddToCart as gaAddToCart } from '@/lib/analytics/gtag';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug;
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    if (slug) {
      // Fetch product details
      fetch(`/api/products/${slug}`)
        .then(res => (res.ok ? res.json() : { product: null }))
        .then(data => {
          const prod = data.product || null;
          setProduct(prod);
          setLoading(false);
          
          if (prod) {
            trackViewItem(prod);
            // Fetch related products
            return fetch(`/api/products/${slug}/related`)
              .then(res => (res.ok ? res.json() : { products: [] }))
              .then(relData => {
                setRelatedProducts(relData.products || []);
              });
          }
        })
        .catch(err => {
          console.error('Failed to load product:', err);
          setLoading(false);
        });
    }
  }, [slug]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      gaAddToCart(product, quantity);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, quantity);
      gaAddToCart(product, quantity);
      router.push('/cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-burhan-background pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-2xl skeleton" />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-lg skeleton" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded skeleton" />
              <div className="h-12 bg-gray-200 rounded skeleton" />
              <div className="h-24 bg-gray-200 rounded skeleton" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-burhan-background pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold text-burhan-primary mb-4">
            Product not found
          </h2>
          <a
            href="/shop"
            className="text-burhan-secondary hover:text-burhan-primary font-semibold"
          >
            Back to Shop
          </a>
        </div>
      </div>
    );
  }

  const productImages = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images
    : (product.thumbnail ? [product.thumbnail] : (product.image ? [product.image] : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500']));
  const activeImage = productImages[selectedImage] || productImages[0];

  return (
    <div className="min-h-screen bg-burhan-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square relative overflow-hidden rounded-2xl bg-white mb-4 image-zoom-container"
            >
              <Image
                src={activeImage}
                alt={product.name}
                fill
                referrerPolicy="no-referrer"
                className="object-cover image-zoom"
              />
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <span className="bg-burhan-success text-white text-xs font-semibold px-3 py-1 rounded-full">
                    NEW
                  </span>
                )}
                {product.discount > 0 && (
                  <span className="bg-burhan-error text-white text-xs font-semibold px-3 py-1 rounded-full">
                    -{product.discount}%
                  </span>
                )}
              </div>
            </motion.div>

            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square relative overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === index
                        ? 'border-burhan-secondary'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-burhan-warning text-burhan-warning'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-burhan-text-secondary">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>

              {/* Name */}
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-burhan-primary mb-4">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-4xl font-bold text-burhan-primary">
                  PKR {product.price.toLocaleString()}
                </span>
                {product.oldPrice && (
                  <span className="text-xl text-gray-400 line-through">
                    PKR {product.oldPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-burhan-text-secondary text-lg mb-6">
                {product.description}
              </p>

              {/* Stock Status */}
              <div className="mb-6">
                {product.stock > 0 ? (
                  <div className="flex items-center space-x-2 text-burhan-success">
                    <Check className="w-5 h-5" />
                    <span className="font-semibold">In Stock ({product.stock} units available)</span>
                  </div>
                ) : (
                  <div className="text-burhan-error font-semibold">Out of Stock</div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-burhan-text-primary font-semibold mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center font-semibold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 h-10 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center font-semibold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-burhan-primary text-white py-4 rounded-xl font-semibold text-lg hover:bg-burhan-secondary transition-colors ripple flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-1 bg-burhan-accent text-white py-4 rounded-xl font-semibold text-lg hover:bg-burhan-secondary transition-colors ripple disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
                <button
                  onClick={() => toggleWishlist(product)}
                  className="w-14 h-14 bg-white border-2 border-burhan-primary rounded-xl flex items-center justify-center hover:bg-burhan-primary hover:text-white transition-colors"
                >
                  <Heart
                    className={`w-6 h-6 ${
                      isInWishlist(product._id)
                        ? 'fill-burhan-error text-burhan-error'
                        : ''
                    }`}
                  />
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-white rounded-xl">
                  <Truck className="w-6 h-6 text-burhan-secondary mx-auto mb-2" />
                  <div className="text-sm font-semibold text-burhan-primary">Fast Delivery</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl">
                  <Shield className="w-6 h-6 text-burhan-secondary mx-auto mb-2" />
                  <div className="text-sm font-semibold text-burhan-primary">{product.warranty}</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl">
                  <RotateCcw className="w-6 h-6 text-burhan-secondary mx-auto mb-2" />
                  <div className="text-sm font-semibold text-burhan-primary">Easy Returns</div>
                </div>
              </div>

              {/* SKU */}
              <div className="text-sm text-burhan-text-secondary">
                SKU: {product.sku}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mb-16">
          <div className="bg-white rounded-2xl p-8">
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-6">
              Product Details
            </h2>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-lg text-burhan-primary mb-4">Features</h3>
                <ul className="grid md:grid-cols-2 gap-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-burhan-success mt-0.5 flex-shrink-0" />
                      <span className="text-burhan-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-lg text-burhan-primary mb-4">Specifications</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between border-b pb-2">
                      <span className="font-semibold text-burhan-text-primary">{key}</span>
                      <span className="text-burhan-text-secondary">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* What's in the Box */}
            {product.inBox && product.inBox.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-burhan-primary mb-4">What's in the Box</h3>
                <ul className="space-y-2">
                  {product.inBox.map((item, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-burhan-secondary rounded-full"></div>
                      <span className="text-burhan-text-secondary">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="font-heading text-3xl font-bold text-burhan-primary mb-8">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct._id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
