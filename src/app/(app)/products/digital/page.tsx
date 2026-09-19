'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/cart-context';
import { type Product } from '@/lib/types';
import { motion } from 'motion/react';
import Image from 'next/image';
import { Check, Star, Filter, Heart, FileText, Gift, Award, HelpCircle, Download, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

// Curated list of high-quality digital products in Angola
const DIGITAL_PRODUCTS: (Product & { rating: number; reviews: number; fileFormat: string; fileSize?: string; category: string; deliveriesCount: number })[] = [
  {
    id: 'dig-1',
    vendorId: 'vendor-matondelo-edu',
    name: 'Guia Prático: Investimentos de Sucesso em Angola',
    description: 'Aprenda as melhores estratégias e ferramentas para investir com inteligência no mercado angolano em 2026. Inclui análises de obrigações do tesouro e imobiliário.',
    price: 8500,
    imageUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=400',
    rating: 4.9,
    reviews: 53,
    category: 'Ebooks e Guias',
    fileFormat: 'PDF',
    fileSize: '4.8 MB',
    deliveriesCount: 312
  },
  {
    id: 'dig-2',
    vendorId: 'vendor-matondelo-gift',
    name: 'Cartão Presente Digital Matondelo - 15.000 Kz',
    description: 'Ofereça o presente ideal com o nosso voucher de compras digitais. Pode ser usado para reservar serviços, pedir táxis ou comprar produtos na plataforma.',
    price: 15000,
    imageUrl: 'https://images.unsplash.com/photo-1549463511-1072945d4715?auto=format&fit=crop&q=80&w=400',
    rating: 4.8,
    reviews: 19,
    category: 'Cartões Presente',
    fileFormat: 'Código de Ativação',
    deliveriesCount: 145
  },
  {
    id: 'dig-3',
    vendorId: 'vendor-matondelo-edu',
    name: 'Curso Online: Finanças Pessoais & Orçamentação',
    description: 'Domine a arte de organizar o seu orçamento mensal, poupar em tempos desafiantes e planear o seu futuro financeiro familiar passo a passo.',
    price: 25000,
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400',
    rating: 5.0,
    reviews: 38,
    category: 'Cursos Online',
    fileFormat: 'Video-Aulas + Material PDF',
    deliveriesCount: 94
  },
  {
    id: 'dig-4',
    vendorId: 'vendor-matondelo-tech',
    name: 'Pack de Modelos de Contratos de Prestação de Serviços',
    description: 'Documentos legais completamente editáveis em formato Word, adaptados à legislação de Angola para freelancers, prestadores e pequenas empresas.',
    price: 4900,
    imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=400',
    rating: 4.7,
    reviews: 24,
    category: 'Modelos e Documentos',
    fileFormat: 'DOCX (Word)',
    fileSize: '1.2 MB',
    deliveriesCount: 220
  },
  {
    id: 'dig-5',
    vendorId: 'vendor-matondelo-tech',
    name: 'Licença Oficial Antivírus Premium (1 Ano - 1 PC)',
    description: 'Segurança absoluta para o seu computador de trabalho ou pessoal contra malware, vírus e tentativas de phishing na internet.',
    price: 18000,
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=400',
    rating: 4.6,
    reviews: 12,
    category: 'Software',
    fileFormat: 'Chave de Licença Digital',
    deliveriesCount: 88
  }
];

export default function DigitalProductsPage() {
  const { addProductToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  const categories = ['Todos', 'Ebooks e Guias', 'Cartões Presente', 'Cursos Online', 'Modelos e Documentos', 'Software'];

  const filteredProducts = selectedCategory === 'Todos'
    ? DIGITAL_PRODUCTS
    : DIGITAL_PRODUCTS.filter(p => p.category === selectedCategory);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const handleAddToCart = (product: Product) => {
    addProductToCart(product);
    setAddedItems(prev => ({ ...prev, [product.id]: true }));
    
    // Auto-reset success state after 2 seconds
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [product.id]: false }));
    }, 2000);

    toast({
      title: "Adicionado ao Carrinho!",
      description: `${product.name} foi adicionado.`,
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50/50" id="digital-store-page">
      {/* Hero Banner Secundário */}
      <div className="relative bg-gradient-to-r from-teal-600 to-cyan-700 py-16 px-4 sm:px-6 lg:px-8 text-white overflow-hidden shadow-inner">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest bg-teal-500/30 text-teal-100 px-3 py-1 rounded-full border border-teal-400/20">
              Produtos Digitais
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight font-headline">
            Loja de Produtos Digitais
          </h1>
          <p className="mt-3 text-lg text-teal-100 max-w-2xl leading-relaxed">
            Ebooks, cursos exclusivos, software e cartões de oferta com download ou entrega imediata por correio eletrónico.
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
                  ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-105'
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
                      src={product.imageUrl || 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&q=80&w=400'}
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

                    {/* Categoria */}
                    <Badge className="absolute bottom-3 left-3 bg-black/60 hover:bg-black/80 text-white font-semibold text-[9px] tracking-wider px-2 py-0.5">
                      {product.category}
                    </Badge>

                    {/* Formato do Arquivo */}
                    <Badge className="absolute top-3 left-3 bg-teal-500 text-white font-extrabold text-[9px] tracking-wider px-2 py-0.5 uppercase border border-teal-400/20 shadow-sm">
                      {product.fileFormat}
                    </Badge>
                  </div>

                  {/* Conteúdo do Card */}
                  <CardContent className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <div className="flex items-center gap-1">
                          <div className="flex items-center text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span className="text-xs font-bold ml-1">{product.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-xs text-neutral-400">({product.reviews} avaliações)</span>
                        </div>
                        {product.fileSize && (
                          <span className="text-xs text-neutral-400 font-medium">Tamanho: {product.fileSize}</span>
                        )}
                      </div>

                      <h3 className="font-headline font-bold text-lg text-neutral-800 line-clamp-1 group-hover:text-teal-600 transition-colors">
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
                        <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                          {product.deliveriesCount} downloads este mês
                        </span>
                      </div>

                      {/* Botão de Compra */}
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className={`w-full py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                          isAdded
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100 shadow-md'
                            : 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-100'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Adicionado!</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            <span>Comprar & Download</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Selos de Confiança Digitais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pt-8 border-t border-neutral-200">
          <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600 shrink-0">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-neutral-800">Entrega Instantânea</h4>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                Aceda e descarregue os seus ficheiros ou códigos logo após a confirmação do pagamento.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600 shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-neutral-800">Qualidade Garantida</h4>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                Conteúdos cuidadosamente validados por peritos e perfeitamente atualizados para o mercado.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600 shrink-0">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-neutral-800">Suporte 24/7 Exclusivo</h4>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                Dúvidas no acesso? A nossa equipa de apoio técnico está pronta para ajudar a qualquer hora.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
