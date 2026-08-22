import { Building2, Utensils, Stethoscope, Scissors, Paintbrush, Printer, FerrisWheel, type LucideProps, Combine, Layers, ShoppingCart, Hospital, Landmark, Wrench, Fuel, School, GraduationCap, HeartHandshake, Scale, Store, DollarSign, Shield, Brush, Globe, Phone, Wifi, Briefcase, Cake } from 'lucide-react';
import type { ServiceCategory } from '@/lib/types';

export const categoryDetails: Record<ServiceCategory, { icon: React.ElementType<LucideProps>; label: string }> = {
  'Hotel': { icon: Building2, label: 'Hotéis' },
  'Restaurante': { icon: Utensils, label: 'Restaurantes' },
  'Pizzarias': { icon: Utensils, label: 'Pizzarias' },
  'Humburguerias': { icon: Utensils, label: 'Hambúrguerias' },
  'Clínica': { icon: Stethoscope, label: 'Clínicas' },
  'Barbearia': { icon: Scissors, label: 'Barbearias' },
  'Salão de Beleza': { icon: Paintbrush, label: 'Salões' },
  'Gráfica': { icon: Printer, label: 'Gráficas' },
  'Agências de Turismo e Viagens': { icon: FerrisWheel, label: 'Turismo' },
  'Salão de Cabeleireiro': { icon: Combine, label: 'Cabeleireiros'},
  'Empresas de alumínio, vidro e Inox': { icon: Layers, label: 'Alumínio, Vidro, Inox' },
  'Supermercado': { icon: ShoppingCart, label: 'Supermercados' },
  'Hospitais': { icon: Hospital, label: 'Hospitais' },
  'Instituições Públicas': { icon: Landmark, label: 'Instituições Públicas' },
  'Oficinas Auto': { icon: Wrench, label: 'Oficinas Auto' },
  'Bairro Fiscal': { icon: Landmark, label: 'Bairros Fiscais'},
  'Bombas de combustível': { icon: Fuel, label: 'Postos de Combustível' },
  'Faculdades': { icon: School, label: 'Faculdades' },
  'Colégios': { icon: School, label: 'Colégios' },
  'Institutos Superiores': { icon: GraduationCap, label: 'Institutos Superiores' },
  'Centros de Formação Profissional': { icon: Briefcase, label: 'Formação Profissional' },
  'Administrações Municipais': { icon: Landmark, label: 'Administrações' },
  'Serviços protocolares': { icon: Landmark, label: 'Embaixadas' },
  'Serviços de Utilidade Pública': { icon: HeartHandshake, label: 'ONGs & Associações' },
  'Justiça e Tribunais': { icon: Scale, label: 'Justiça e Tribunais' },
  'Shoppings': { icon: Store, label: 'Shoppings' },
  'Loja': { icon: Store, label: 'Lojas' },
  'Bancos': { icon: DollarSign, label: 'Bancos' },
  'Seguradoras': { icon: Shield, label: 'Seguradoras' },
  'Galeria de Arte': { icon: Brush, label: 'Galerias de Arte' },
  'Salão de Festas': { icon: Cake, label: 'Salões de Festas'},
  'Multinacionais': { icon: Globe, label: 'Multinacionais'},
  'Operadoras de Redes Telefónicas': { icon: Phone, label: 'Operadoras'},
  'Provedores de Internet': { icon: Wifi, label: 'Internet'},
  'Outros': { icon: Briefcase, label: 'Outros'},
};

type CategoryIconProps = {
  category: ServiceCategory;
} & LucideProps;

export function CategoryIcon({ category, style, ...props }: CategoryIconProps) {
  const Icon = categoryDetails[category]?.icon;
  return Icon ? <Icon style={{ stroke: 'url(#matondelo-gradient)', ...style }} {...(props as any)} /> : null;
}
