'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/cart-context';
import { type Product } from '@/lib/types';
import { motion } from 'motion/react';
import Image from 'next/image';
import { ShoppingCart, ShoppingBag, Check, Star, Filter, Heart, ChevronRight, Truck, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

// Curated list of high-quality physical products in Angola
const PHYSICAL_PRODUCTS: (Product & { rating: number; reviews: number; originalPrice?: number; discount?: number; category: string; inStock: boolean })[] = [
  {
    id: 'phys-1',
    vendorId: 'vendor-matondelo-retail',
    name: 'Smartphone Samsung Galaxy A54 5G',
    description: 'Excelente ecrã Super AMOLED de 120Hz, câmara de alta resolução de 50MP e bateria de longa duração para o seu dia a dia em Luanda.',
    price: 185000,
    originalPrice: 210000,
    discount: 12,
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=400',
    rating: 4.8,
    reviews: 42,
    category: 'Eletrónicos',
    inStock: true
  },
  {
    id: 'phys-2',
    vendorId: 'vendor-matondelo-retail',
    name: 'Auscultadores Bluetooth Premium Noise Cancelling',
    description: 'Som de alta fidelidade com cancelamento ativo de ruído para trabalhar e viajar em total tranquilidade.',
    price: 75000,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
    rating: 4.7,
    reviews: 28,
    category: 'Acessórios',
    inStock: true
  },
  {
    id: 'phys-3',
    vendorId: 'vendor-artes-angola',
    name: 'Estátua Pensador de Madeira Nobre (Pequena)',
    description: 'Tradicional obra de arte angolana esculpida à mão por artesãos locais. Símbolo nacional de sabedoria e cultura.',
    price: 35000,
    originalPrice: 40000,
    discount: 12,
    imageUrl: 'https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&q=80&w=400',
    rating: 4.9,
    reviews: 15,
    category: 'Artesanato',
    inStock: true
  },
  {
    id: 'phys-4',
    vendorId: 'vendor-matondelo-retail',
    name: 'Mochila Antirroubo Impermeável com Porta USB',
    description: 'Segurança e sofisticação para transportar o seu computador portátil e pertences de forma inteligente.',
    price: 24000,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400',
    rating: 4.5,
    reviews: 31,
    category: 'Moda e Viagem',
    inStock: true
  },
  {
    id: 'phys-5',
    vendorId: 'vendor-livraria-benguela',
    name: 'Livro: "Mayombe" - Pepetela (Edição Especial)',
    description: 'Obra fundamental da literatura angolana que narra as vivências e reflexões dos guerrilheiros do MPLA na floresta do Mayombe.',
    price: 12500,
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    rating: 5.0,
    reviews: 64,
    category: 'Livros',
    inStock: true
  },
  {
    id: 'phys-6',
    vendorId: 'vendor-matondelo-retail',
    name: 'Smartwatch Sport Fit Pro',
    description: 'Monitorização avançada de batimentos cardíacos, passos, sono e notificações do telemóvel para um estilo de vida ativo.',
    price: 48000,
    originalPrice: 55000,
    discount: 13,
    imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=400',
    rating: 4.6,
    reviews: 19,
    category: 'Eletrónicos',
    inStock: false
  }
];

export default function PhysicalProductsPage() {
  const { addProductToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  const categories = ['Todos', 'Eletrónicos', 'Acessórios', 'Artesanato', 'Moda e Viagem', 'Livros'];

  const filteredProducts = selectedCategory === 'Todos'
    ? PHYSICAL_PRODUCTS
    : PHYSICAL_PRODUCTS.filter(p => p.category === selectedCategory);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const handleAddToCart = (product: Product) => {
    addProductToCart(product);
    setAddedItems(prev => ({ ...prev, [product.id]: true }));
    
    // Auto-reset success icon state after 2 seconds
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [product.id]: false }));
    }, 2000);

    toast({
      title: "Adicionado ao Carrinho!",
      description: `${product.name} foi adicionado com sucesso.`,
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50/50" id="physical-store-page">
      {/* Hero Banner Secundário */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 py-16 px-4 sm:px-6 lg:px-8 text-white overflow-hidden shadow-inner">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest bg-blue-500/30 text-blue-100 px-3 py-1 rounded-full border border-blue-400/20">
              Produtos Físicos
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight font-headline">
            Loja de Produtos Físicos
          </h1>
          <p className="mt-3 text-lg text-blue-100 max-w-2xl leading-relaxed">
            Descubra eletrónicos, moda, artesanato angolano e livros com entrega rápida diretamente à sua porta.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros por Categorias */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
          <div className="flex items-center gap-1.5 text-neutral-500 mr-2 shrink-0">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filtrar:</span>
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border shrink-0 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grelha de Produtos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6" id="products-grid">
          {filteredProducts.map((product, index) => {
            const isFav = favorites.includes(product.id);
            const isAdded = addedItems[product.id];
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="h-full flex flex-col justify-between overflow-hidden border border-neutral-200/80 bg-white hover:shadow-xl transition-all duration-300 relative group">
                  
                  {/* Imagem do Produto */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                    <Image
                      src={product.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400'}
                      alt={product.name}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Botão de Favorito */}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-sm transition-all active:scale-95 z-10 ${
                        isFav 
                          ? 'bg-red-50 text-red-500' 
                          : 'bg-white/80 text-neutral-500 hover:text-red-500'
                      }`}
                      title={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                    >
                      <Heart className={`h-4.5 w-4.5 ${isFav ? 'fill-current' : ''}`} />
                    </button>

                    {/* Badge de Desconto */}
                    {product.discount && (
                      <Badge className="absolute top-3 left-3 bg-red-500 hover:bg-red-600 text-white font-extrabold text-[10px] tracking-wider px-2 py-0.5 uppercase">
                        Poupa {product.discount}%
                      </Badge>
                    )}

                    {/* Categoria */}
                    <Badge className="absolute bottom-3 left-3 bg-black/60 hover:bg-black/80 text-white font-semibold text-[9px] tracking-wider px-2 py-0.5">
                      {product.category}
                    </Badge>
                  </div>

                  {/* Conteúdo do Card */}
                  <CardContent className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="flex items-center text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="text-xs font-bold ml-1">{product.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-neutral-400">({product.reviews} avaliações)</span>
                      </div>

                      <h3 className="font-headline font-bold text-lg text-neutral-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>

                      <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-5">
                      {/* Bloco de Preços */}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-black text-neutral-900 font-headline">
                          {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-neutral-400 line-through">
                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.originalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Botão de Ação de Compra */}
                      {product.inStock ? (
                        <Button
                          onClick={() => handleAddToCart(product)}
                          className={`w-full py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                            isAdded
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100 shadow-md'
                              : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-md'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="h-4 w-4" />
                              <span>Adicionado!</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4" />
                              <span>Adicionar ao Carrinho</span>
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          disabled
                          className="w-full py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200"
                        >
                          Esgotado em Benguela
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Selos de Confiança */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pt-8 border-t border-neutral-200">
          <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-neutral-800">Entregas em toda Angola</h4>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                Logística expresso em Luanda, Benguela, Huambo e províncias vizinhas.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-neutral-800">Garantia 100% Segura</h4>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                Transações protegidas por Saldo Virtual ou pagamento no ato de entrega física.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-neutral-800">Devoluções Facilitadas</h4>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                Tem até 14 dias para trocar ou solicitar o reembolso direto na sua carteira virtual.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
