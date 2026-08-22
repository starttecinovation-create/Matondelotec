

'use client';

export type Announcement = {
  id: string;
  message: string;
  link?: string;
  isActive: boolean;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};

export type ServiceCategory = 
  | 'Hotel' 
  | 'Restaurante' 
  | 'Clínica' 
  | 'Barbearia' 
  | 'Salão de Beleza' 
  | 'Gráfica' 
  | 'Agências de Turismo e Viagens' 
  | 'Salão de Cabeleireiro' 
  | 'Empresas de alumínio, vidro e Inox'
  | 'Supermercado'
  | 'Hospitais'
  | 'Instituições Públicas'
  | 'Oficinas Auto'
  | 'Pizzarias'
  | 'Humburguerias'
  | 'Bairro Fiscal'
  | 'Bombas de combustível'
  | 'Faculdades'
  | 'Colégios'
  | 'Institutos Superiores'
  | 'Centros de Formação Profissional'
  | 'Administrações Municipais'
  | 'Serviços protocolares'
  | 'Serviços de Utilidade Pública'
  | 'Justiça e Tribunais'
  | 'Shoppings'
  | 'Bancos'
  | 'Seguradoras'
  | 'Galeria de Arte'
  | 'Multinacionais'
  | 'Operadoras de Redes Telefónicas'
  | 'Provedores de Internet'
  | 'Salão de Festas'
  | 'Loja'
  | 'Outros';

export type UserRole = 'user' | 'vendor' | 'driver' | 'admin';

export type DriverCategory = 'taxi' | 'moto_taxi' | 'tow_truck' | 'goods_vehicle';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  balance: number;
  category?: ServiceCategory;
  driverType?: DriverCategory;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  location?: {
    country: string;
    province: string;
    city: string;
    district?: string;
    commune?: string;
  };
  verificationStatus?: VerificationStatus;
  userDocuments?: {
    identityCardUrl?: string;
    criminalRecordUrl?: string;
    drivingLicenseUrl?: string;
    vehicleRegistrationUrl?: string;
    vehicleOwnershipUrl?: string;
    selfieVideoUrl?: string;
    vehicleFrontVideoUrl?: string;
    vehicleSidesVideoUrl?: string;
  };
  welcomeKit?: {
    tshirt?: boolean;
    cap?: boolean;
  };
  referralCode?: string;
  referredBy?: string | null;
  referralEarnings?: number;
  referralCount?: number;
};

export type LocalContact = {
    name: string;
    phone: string;
}

export type Service = {
  id: string;
  vendorId: string; // The UID of the user with 'vendor' role
  name: string;
  description: string;
  price: number;
  category: ServiceCategory;
  imageUrls: string[];
  fuelStatus?: 'available' | 'limited' | 'unavailable';
  location: { 
    latitude: number;
    longitude: number;
  };
  localContacts?: LocalContact[];
};

export type Product = {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
}

export type Booking = {
    id: string; // The doc id
    userId: string;
    vendorId: string;
    serviceId: string; // Full Firestore path
    serviceName: string;
    date: string; // Stored as YYYY-MM-DD
    status: 'Confirmada' | 'Pendente' | 'Cancelada';
};

export type Transaction = {
    id: string;
    userId: string;
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    transactionDate: {
        seconds: number;
        nanoseconds: number;
    };
};

export type TouristSpot = {
  id: string;
  name: string;
  description: string;
  location: string;
  imageUrls: string[];
  imageHint?: string;
}

export type Notification = {
    id: string;
    userId: string;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    };
    message: string;
    status: 'read' | 'unread';
};

export type CartItem = {
    id: string; // Corresponds to the product ID
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    vendorId: string;
};

export type Order = {
    id: string;
    userId: string;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    };
    items: CartItem[];
    totalAmount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentMethod: 'virtual_balance' | 'cash_on_delivery';
};

export type PageContent = {
  id: string;
  title: string;
  headline: string;
  paragraphs: string[];
};

export type SiteSettings = {
    id: string;
    subscriptionPrice: number;
    paypalUsdToAoaRate: number;
    paypalProcessingFee: number;
    multicaixaPublicKey?: string;
    multicaixaApiToken?: string;
};


// This represents the detailed result from a PlacesService.getDetails() call.
export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: {
    location: google.maps.LatLng;
    viewport: google.maps.LatLngBounds;
  };
  types?: string[];
  // Add other fields you might need, like photos, reviews, etc.
}

export const serviceCategories: ServiceCategory[] = [
    'Hotel', 
    'Restaurante',
    'Pizzarias',
    'Humburguerias',
    'Clínica', 
    'Barbearia', 
    'Salão de Beleza', 
    'Salão de Cabeleireiro', 
    'Gráfica', 
    'Agências de Turismo e Viagens', 
    'Empresas de alumínio, vidro e Inox',
    'Supermercado',
    'Shoppings',
    'Loja',
    'Hospitais',
    'Instituições Públicas',
    'Oficinas Auto',
    'Bairro Fiscal',
    'Bombas de combustível',
    'Faculdades',
    'Colégios',
    'Institutos Superiores',
    'Centros de Formação Profissional',
    'Administrações Municipais',
    'Serviços protocolares',
    'Serviços de Utilidade Pública',
    'Justiça e Tribunais',
    'Bancos',
    'Seguradoras',
    'Galeria de Arte',
    'Salão de Festas',
    'Multinacionais',
    'Operadoras de Redes Telefónicas',
    'Provedores de Internet',
    'Outros',
];

// Type for PayPal Order creation
export type PayPalOrder = {
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchase_units: {
    amount: {
      currency_code: 'USD' | 'EUR' | 'AOA';
      value: string;
    };
    description?: string;
  }[];
};

export type Subscription = {
  id: string;
  vendorId: string;
  startDate: {
    seconds: number;
    nanoseconds: number;
  };
  endDate: {
    seconds: number;
    nanoseconds: number;
  };
  amountPaid: number;
  status: 'active' | 'expired' | 'cancelled';
};

export type TaxiRequest = {
    id: string;
    userId: string;
    pickupLocation: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
    driverId?: string;
    createdAt: any;
};

export type TaxiClass = 'economico' | 'conforto' | 'executivo';

export type Taxi = {
    id: string;
    driverId: string;
    driverName: string;
    plateNumber: string;
    model: string;
    location: {
        lat: number;
        lng: number;
    };
    status: 'available' | 'busy' | 'offline';
    pricingDescription: string;
    routes: string[];
    operationalNotes?: string;
    referredBy?: string | null;
    taxiClass: TaxiClass;
};
