'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  Globe, 
  Coins, 
  ArrowUpRight, 
  HelpCircle, 
  Check, 
  BookOpen, 
  AlertCircle, 
  Info, 
  TrendingUp, 
  ExternalLink,
  ChevronDown,
  Lock,
  DollarSign,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// CONFIGURAÇÃO DOS LINKS DE INDICAÇÃO (REFERRAL/AFFILIATE LINKS)
// Substitua os links abaixo pelos seus links de afiliado reais
const REFERRAL_LINKS = {
  redotpay: 'https://www.redotpay.com/en/activity/invite-friends/?referral-code=xxxxxx', // Redotpay
  wise: 'https://wise.com/invite/u/xxxxxx',                                             // Wise
  binance: 'https://accounts.binance.com/register?ref=xxxxxx',                           // Binance
  airtm: 'https://app.airtm.com/invite/xxxxxx',                                         // AirTM
  bybit: 'https://www.bybit.com/invite?ref=xxxxxx'                                      // Bybit
};

type PlatformId = 'redotpay' | 'wise' | 'binance' | 'airtm' | 'bybit';

interface PlatformDetails {
  id: PlatformId;
  name: string;
  badge: string;
  logoColor: string;
  bgColor: string;
  borderColor: string;
  difficulty: 'Fácil' | 'Médio' | 'Avançado';
  time: string;
  cost: string;
  requirements: string[];
  referralLink: string;
  proTip: string;
  steps: {
    title: string;
    description: string;
    details?: string;
  }[];
}

const PLATFORMS: Record<PlatformId, PlatformDetails> = {
  redotpay: {
    id: 'redotpay',
    name: 'Redotpay',
    badge: 'A Mais Recomendada para Angola',
    logoColor: 'text-[#EB4A24]',
    bgColor: 'bg-[#EB4A24]/10',
    borderColor: 'border-[#EB4A24]/30',
    difficulty: 'Fácil',
    time: '5 a 10 minutos',
    cost: '$10 dólares (Atualmente com bónus de $5 no registo)',
    requirements: [
      'Bilhete de Identidade (BI) ou Passaporte angolano',
      'Smartphone (Android ou iOS)',
      'Saldo em Cripto (USDT) na Binance ou Bybit para carregamento'
    ],
    referralLink: REFERRAL_LINKS.redotpay,
    proTip: 'A Redotpay aprova o Bilhete de Identidade angolano em menos de 5 minutos! É de longe o cartão virtual mais estável e económico para fazer compras na Amazon, Shein, pagar anúncios do Facebook/Instagram e assinar serviços como Netflix e Spotify.',
    steps: [
      {
        title: 'Fazer o registo na plataforma',
        description: 'Clique no botão de indicação abaixo para aceder à página oficial da Redotpay e obter o bónus inicial de $5 USD.',
        details: 'Introduza o seu e-mail ou número de telefone e defina uma palavra-passe segura.'
      },
      {
        title: 'Descarregar a aplicação móvel',
        description: 'Faça o download da app oficial da Redotpay na Google Play Store ou Apple App Store.',
        details: 'Abra a aplicação e inicie sessão com a conta que acabou de registar.'
      },
      {
        title: 'Concluir a Verificação de Identidade (KYC)',
        description: 'Aceda ao menu de perfil na app e selecione "Verificação de Identidade".',
        details: 'Selecione Angola como país, escolha "Bilhete de Identidade" ou "Passaporte", tire uma foto nítida do documento e faça uma rápida selfie de verificação facial.'
      },
      {
        title: 'Depositar fundos na carteira',
        description: 'Para ativar o cartão virtual de $10 USD, precisará de carregar a carteira com o valor necessário.',
        details: 'A forma mais rápida é copiar a sua morada de depósito USDT (rede BSC - BEP20) na Redotpay e transferir USDT a partir da sua conta Binance ou Bybit. O carregamento é instantâneo.'
      },
      {
        title: 'Emitir o seu Cartão Visa Virtual',
        description: 'Vá ao separador "Cartões" (ícone de cartão na barra inferior) e clique em "Solicitar Cartão" (Virtual Card).',
        details: 'Confirme o pagamento de $10 USD. Se usou o link de convite, os $5 de bónus serão descontados, pagando apenas os restantes $5. O cartão é gerado instantaneamente!'
      }
    ]
  },
  wise: {
    id: 'wise',
    name: 'Wise (Antiga TransferWise)',
    badge: 'Melhores Taxas de Câmbio do Mundo',
    logoColor: 'text-[#00B67A]',
    bgColor: 'bg-[#00B67A]/10',
    borderColor: 'border-[#00B67A]/30',
    difficulty: 'Médio',
    time: '24 a 48 horas',
    cost: 'Gratuito (Requer depósito inicial de ativação de £20/€20)',
    requirements: [
      'Passaporte válido (Altamente recomendado)',
      'Comprovativo de morada europeu ou temporário de familiar no exterior',
      'Depósito inicial de ativação (realizado por transferência internacional ou P2P)'
    ],
    referralLink: REFERRAL_LINKS.wise,
    proTip: 'Como a Wise ainda não envia cartões físicos para Angola, muitos angolanos ativam a conta utilizando uma morada internacional de familiares ou de residência virtual para desbloquear a emissão do Cartão Visa Virtual gratuito. Este cartão é excelente porque cobra taxas de conversão quase nulas nas moedas globais.',
    steps: [
      {
        title: 'Criar conta Wise',
        description: 'Registe-se usando o botão de recomendação abaixo para obter um desconto exclusivo de taxa na sua primeira transferência.',
        details: 'Crie a sua conta de forma gratuita preenchendo as informações solicitadas.'
      },
      {
        title: 'Verificar Identidade com o Passaporte',
        description: 'Envie uma imagem nítida do seu Passaporte na secção de segurança e verificação.',
        details: 'O passaporte é aprovado quase de imediato, garantindo a legitimidade da conta bancária internacional.'
      },
      {
        title: 'Realizar o depósito de ativação de conta',
        description: 'A Wise exige um depósito inicial de ativação no valor equivalente a £20 ou €20.',
        details: 'Este valor fica totalmente disponível para si! Pode depositar usando o cartão de um amigo que viva no exterior ou comprar saldo Wise no mercado peer-to-peer de Angola.'
      },
      {
        title: 'Configurar morada para emissão do cartão',
        description: 'Para emitir o cartão virtual, configure uma morada válida num país suportado (ex: Portugal/Europa).',
        details: 'Como o cartão é virtual, não precisará de o receber fisicamente. Ele ficará disponível instantaneamente na sua aplicação.'
      },
      {
        title: 'Ativar o Cartão Visa Virtual na App',
        description: 'No menu "Cartões", escolha a opção "Cartão Digital / Virtual" e solicite a sua criação de forma gratuita.',
        details: 'O cartão estará pronto de imediato para ser adicionado ao Apple Pay, Google Wallet ou para compras online diretas.'
      }
    ]
  },
  binance: {
    id: 'binance',
    name: 'Binance',
    badge: 'O Motor Financeiro de Angola (P2P)',
    logoColor: 'text-[#F3BA2F]',
    bgColor: 'bg-[#F3BA2F]/10',
    borderColor: 'border-[#F3BA2F]/30',
    difficulty: 'Médio',
    time: '15 a 30 minutos',
    cost: 'Registo Gratuito (Compra mínima de P2P em Kwanzas: ~5.000 Kz)',
    requirements: [
      'Bilhete de Identidade (BI) ou Passaporte angolano',
      'Conta bancária angolana (BAI, BFA, BIC, SOL, etc.) com Multicaixa Express',
      'Smartphone ou Computador com internet'
    ],
    referralLink: REFERRAL_LINKS.binance,
    proTip: 'A Binance é a plataforma principal que irá utilizar para converter os seus Kwanzas (AOA) em dólares digitais (USDT). É através do mercado P2P (Peer-to-Peer) da Binance que compra dólares de forma segura de outros angolanos via transferência bancária, para depois carregar o seu cartão virtual (como Redotpay).',
    steps: [
      {
        title: 'Registrar na Binance',
        description: 'Clique no botão abaixo para iniciar o registo de conta de forma segura com bónus de comissão.',
        details: 'Registe-se usando o seu e-mail ou número de telemóvel e crie uma palavra-passe robusta.'
      },
      {
        title: 'Completar a Verificação de Identidade (KYC)',
        description: 'Aceda à sua área de perfil e faça a verificação de identidade oficial exigida por lei.',
        details: 'Tire fotos nítidas da frente e verso do seu Bilhete de Identidade (BI) angolano e complete o teste facial em tempo real na app.'
      },
      {
        title: 'Configurar métodos de pagamento bancário',
        description: 'Adicione a sua conta bancária angolana nas definições de pagamento para transações rápidas.',
        details: 'Introduza o seu IBAN e o nome correto do seu banco. Isto permitirá receber e enviar transferências para negociação.'
      },
      {
        title: 'Aceder ao Mercado P2P da Binance',
        description: 'No menu superior, vá a "Comércio P2P" ou na app escolha "P2P". Selecione "Comprar", escolha a criptomoeda "USDT" e filtre o método de pagamento por "AOA" (Kwanzas).',
        details: 'Isto listará todos os vendedores confiáveis de Angola. Escolha um vendedor com alta taxa de conclusão (superior a 95%).'
      },
      {
        title: 'Comprar USDT via Multicaixa Express',
        description: 'Introduza o valor que quer comprar em Kwanzas, clique em comprar e copie os dados bancários do vendedor.',
        details: 'Faça a transferência bancária pelo Multicaixa Express. Após transferir, clique em "Transferido, notificar vendedor". O vendedor confirmará e a Binance libertará automaticamente os seus dólares USDT na carteira Fundos.'
      }
    ]
  },
  airtm: {
    id: 'airtm',
    name: 'AirTM',
    badge: 'A Melhor Ponte para PayPal e Contas Globais',
    logoColor: 'text-[#2470EC]',
    bgColor: 'bg-[#2470EC]/10',
    borderColor: 'border-[#2470EC]/30',
    difficulty: 'Fácil',
    time: '15 a 20 minutos',
    cost: 'Gratuito (Taxa de emissão do cartão virtual: $4.95)',
    requirements: [
      'Bilhete de Identidade (BI) ou Passaporte angolano',
      'Conta bancária nacional ou saldo online (PayPal, Payeer, Skrill, etc.)',
      'Smartphone ou computador'
    ],
    referralLink: REFERRAL_LINKS.airtm,
    proTip: 'A AirTM é extraordinária para quem tem saldo "preso" no PayPal de Angola ou quer converter Kwanzas de forma muito simples para dólares. Ela conecta-o a caixas (parceiros) locais que aceitam pagamentos bancários angolanos, convertendo o seu dinheiro em AirUSD estável para compras globais e emissão de cartões virtuais.',
    steps: [
      {
        title: 'Registrar conta AirTM',
        description: 'Abra a sua conta clicando no botão promocional abaixo para receber um prémio especial em dólar após as primeiras transações.',
        details: 'Preencha o formulário rápido com e-mail e país de residência.'
      },
      {
        title: 'Verificar a conta AirTM',
        description: 'Faça o upload do seu documento de identidade angolano nítido para retirar todos os limites da sua conta.',
        details: 'A verificação móvel rápida é concluída geralmente no próprio dia.'
      },
      {
        title: 'Clicar em "Adicionar" (Add)',
        description: 'Selecione o método de pagamento com que quer financiar a conta. Escolha "Transferência Bancária - Angola" ou "PayPal".',
        details: 'A AirTM mostrará a taxa de conversão em tempo real. Digite o valor e confirme a solicitação.'
      },
      {
        title: 'Efetuar a transferência local',
        description: 'A plataforma vai emparelhá-lo com um utilizador parceiro verificado. Faça a transferência em Kwanzas para o IBAN fornecido por ele.',
        details: 'Após transferir, anexe o comprovativo e confirme na plataforma. O parceiro receberá a notificação, confirmará no banco dele e libertará os dólares AirUSD para a sua carteira AirTM.'
      },
      {
        title: 'Emitir o seu Cartão Virtual AirTM',
        description: 'Vá ao menu "Cartões Virtuais" na barra lateral esquerda e solicite o seu cartão pré-pago Visa/Mastercard.',
        details: 'Escolha o valor que pretende carregar do seu saldo AirTM. O cartão é gerado na hora com todos os dados prontos para compras internacionais.'
      }
    ]
  },
  bybit: {
    id: 'bybit',
    name: 'Bybit',
    badge: 'Taxas Baixas e Excelente Mercado Alternativo',
    logoColor: 'text-[#F1A31B]',
    bgColor: 'bg-[#F1A31B]/10',
    borderColor: 'border-[#F1A31B]/30',
    difficulty: 'Fácil',
    time: '10 a 15 minutos',
    cost: 'Registo Gratuito (Carregamentos mínimos flexíveis via P2P)',
    requirements: [
      'Bilhete de Identidade (BI) ou Passaporte angolano',
      'Aplicativo móvel Bybit ou navegador web',
      'Conta bancária com acesso ao Multicaixa Express'
    ],
    referralLink: REFERRAL_LINKS.bybit,
    proTip: 'A Bybit é hoje uma das maiores e mais confiáveis corretoras do mundo. O seu mercado P2P (Kwanza para USDT) possui taxas extremamente competitivas e uma verificação incrivelmente rápida. Perfeita para quem quer fugir de taxas altas na hora de obter moedas digitais para recarregar cartões virtuais internacionais.',
    steps: [
      {
        title: 'Registrar conta Bybit',
        description: 'Registe-se usando o nosso link de convite oficial abaixo para ganhar acesso ao centro de prémios de boas-vindas da Bybit.',
        details: 'Introduza o seu número de telemóvel angolano ou endereço de e-mail e defina uma senha segura.'
      },
      {
        title: 'Concluir Verificação de Identidade (Nível 1)',
        description: 'Submeta o seu Bilhete de Identidade angolano ou Passaporte utilizando a câmara do seu telemóvel na app Bybit.',
        details: 'A Bybit utiliza inteligência artificial para verificar o documento de imediato. A aprovação demora geralmente menos de 10 minutos.'
      },
      {
        title: 'Aceder ao menu "Comércio P2P"',
        description: 'Vá a "Comprar Cripto" > "Transações P2P". Selecione "Comprar", defina a moeda fiat para "AOA" e cripto para "USDT".',
        details: 'Isso apresentará a lista de comerciantes que vendem dólares em Kwanzas com pagamentos nos principais bancos angolanos (BAI, BFA, SOL, etc.).'
      },
      {
        title: 'Efetuar a negociação segura',
        description: 'Selecione um vendedor de confiança, introduza o montante em Kwanzas e envie o valor via transferência bancária.',
        details: 'Envie o comprovativo de transferência no chat interno da Bybit e clique no botão de pagamento concluído. O saldo USDT é creditado na sua conta Bybit em segurança.'
      },
      {
        title: 'Transferir USDT para carregar o seu Cartão',
        description: 'Utilize os USDT obtidos na Bybit para enviar diretamente para a sua conta Redotpay ou outra plataforma usando a rede BSC (BEP20).',
        details: 'A taxa de envio na rede BEP20 é de apenas alguns cêntimos de dólar, sendo o método ideal de carregamento de cartões de crédito virtuais.'
      }
    ]
  }
};

export default function DigitalWalletsPage() {
  const [activePlatform, setActivePlatform] = useState<PlatformId>('redotpay');
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const { toast } = useToast();

  const platform = PLATFORMS[activePlatform];

  // Carregar progresso do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('wallet_guide_progress');
    if (saved) {
      try {
        setCheckedSteps(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao ler progresso do localStorage', e);
      }
    }
  }, []);

  const handleStepToggle = (stepIndex: number) => {
    const key = `${activePlatform}_step_${stepIndex}`;
    const newChecked = {
      ...checkedSteps,
      [key]: !checkedSteps[key]
    };
    setCheckedSteps(newChecked);
    localStorage.setItem('wallet_guide_progress', JSON.stringify(newChecked));

    if (newChecked[key]) {
      toast({
        title: "Passo Concluído!",
        description: `Excelente progresso no guia do ${platform.name}.`,
        duration: 3000,
      });
    }
  };

  // Calcular progresso da plataforma ativa
  const getPlatformProgress = (platformId: PlatformId) => {
    const totalSteps = PLATFORMS[platformId].steps.length;
    const completed = PLATFORMS[platformId].steps.filter((_, idx) => 
      checkedSteps[`${platformId}_step_${idx}`]
    ).length;
    return Math.round((completed / totalSteps) * 100);
  };

  const handleReferralClick = (platformName: string) => {
    toast({
      title: "A redirecionar...",
      description: `A abrir a página oficial de registo do ${platformName} com link de indicação seguro.`,
      duration: 3000,
    });
  };

  const activeProgress = getPlatformProgress(activePlatform);

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Hero Header Section */}
      <div className="w-full bg-gradient-to-r from-[#EB4A24] to-[#F9A03F] text-white py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl space-y-4">
          <div className="flex items-center gap-3 bg-white/15 w-fit px-3 py-1.5 rounded-full backdrop-blur-xs text-xs md:text-sm font-semibold border border-white/25">
            <CreditCard className="h-4 w-4" />
            <span>Educação Financeira & Pagamentos Globais</span>
          </div>
          <h1 className="font-headline text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Carteiras Digitais & Cartão Visa Virtual
          </h1>
          <p className="max-w-2xl text-white/90 text-sm md:text-lg font-medium leading-relaxed">
            Aprenda o passo a passo prático para obter o seu cartão Visa virtual de forma legal e segura a partir de Angola, utilizando as maiores plataformas financeiras globais.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl space-y-12">
        {/* Selector de Plataformas */}
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold font-headline flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Selecione a Plataforma para Aprender
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(Object.keys(PLATFORMS) as PlatformId[]).map((pId) => {
              const plat = PLATFORMS[pId];
              const isActive = activePlatform === pId;
              const progress = getPlatformProgress(pId);
              return (
                <button
                  key={pId}
                  onClick={() => setActivePlatform(pId)}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all relative overflow-hidden focus:outline-none cursor-pointer ${
                    isActive 
                      ? 'bg-card border-primary shadow-md ring-2 ring-primary/20' 
                      : 'bg-card hover:bg-neutral-50 hover:border-neutral-300 border-neutral-200'
                  }`}
                  id={`btn-platform-${pId}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`font-bold text-base md:text-lg ${plat.logoColor}`}>
                      {plat.name}
                    </span>
                    {progress === 100 && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-50" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    Dificuldade: {plat.difficulty}
                  </span>
                  {progress > 0 && (
                    <div className="w-full mt-3">
                      <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
                        <span>Progresso</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5 bg-neutral-100" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Informações Principais da Plataforma Selecionada */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Coluna de Instruções e Passos (2/3 de largura) */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-neutral-200/80 shadow-xs overflow-hidden">
              <div className="border-b bg-neutral-50/50 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full border border-primary/20">
                      {platform.badge}
                    </span>
                    <span className="text-xs bg-neutral-100 text-neutral-600 font-semibold px-2.5 py-1 rounded-full">
                      Dificuldade: {platform.difficulty}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-headline font-bold mt-2">
                    Guia Passo a Passo: Cartão {platform.name}
                  </h3>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-xs text-muted-foreground">Progresso do Guia</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-primary">{activeProgress}%</span>
                    <Progress value={activeProgress} className="h-2 w-24 bg-neutral-100" />
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-8">
                {/* Lista de Passos */}
                <div className="space-y-6 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-neutral-100">
                  {platform.steps.map((step, index) => {
                    const isChecked = !!checkedSteps[`${activePlatform}_step_${index}`];
                    return (
                      <div key={index} className="flex gap-4 relative group">
                        {/* Indicador de Passo / Checkbox Interativo */}
                        <button
                          onClick={() => handleStepToggle(index)}
                          className={`z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-all cursor-pointer focus:outline-none ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                              : 'bg-white border-neutral-300 text-neutral-500 group-hover:border-primary group-hover:text-primary'
                          }`}
                          aria-label={`Marcar passo ${index + 1} como concluído`}
                        >
                          {isChecked ? (
                            <Check className="h-6 w-6 stroke-[3]" />
                          ) : (
                            <span className="text-sm font-bold">{index + 1}</span>
                          )}
                        </button>

                        <div className="flex-1 bg-neutral-50/50 hover:bg-neutral-50 p-4 rounded-xl border border-neutral-100 transition-colors">
                          <div className="flex items-center justify-between gap-4">
                            <h4 className={`font-semibold text-base ${isChecked ? 'text-neutral-500 line-through' : 'text-neutral-900'}`}>
                              {step.title}
                            </h4>
                            <button
                              onClick={() => handleStepToggle(index)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                                isChecked 
                                  ? 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200' 
                                  : 'bg-primary/5 text-primary hover:bg-primary/10'
                              }`}
                            >
                              {isChecked ? 'Concluído' : 'Marcar Concluído'}
                            </button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            {step.description}
                          </p>
                          {step.details && (
                            <div className="mt-3 bg-white p-3 rounded-lg border border-neutral-100 text-xs text-neutral-600 flex items-start gap-2">
                              <Info className="h-4 w-4 text-[#F9A03F] shrink-0 mt-0.5" />
                              <span>{step.details}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bloco de Botão de Recomendação Prominente */}
                <div className="pt-4 border-t flex flex-col md:flex-row items-center justify-between gap-6 bg-primary/5 p-6 rounded-2xl border border-primary/10">
                  <div className="space-y-1 text-center md:text-left">
                    <h4 className="font-headline font-bold text-lg text-primary flex items-center justify-center md:justify-start gap-1.5">
                      <Coins className="h-5 w-5" />
                      Registar com Link de Indicação
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-md">
                      Apoie o nosso projeto e ganhe bónus de boas-vindas exclusivos como taxas reduzidas ou bónus em dólar ao criar a sua conta oficial através do botão de convite abaixo.
                    </p>
                  </div>
                  <Button 
                    asChild 
                    size="lg" 
                    className="shrink-0 bg-primary hover:bg-primary/95 text-white shadow-md font-bold px-6 py-6 rounded-xl cursor-pointer"
                    onClick={() => handleReferralClick(platform.name)}
                  >
                    <a href={platform.referralLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      Criar Conta no {platform.name}
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Lateral de Requisitos e Dicas (1/3 de largura) */}
          <div className="space-y-6">
            {/* Requisitos de Entrada */}
            <Card className="border-neutral-200/80 shadow-xs">
              <CardHeader className="bg-neutral-50/50 border-b py-4">
                <CardTitle className="text-base font-headline font-semibold flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Requisitos Necessários
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <ul className="space-y-3">
                  {platform.requirements.map((req, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start text-sm text-neutral-700">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-3 border-t text-xs text-muted-foreground space-y-2">
                  <div className="flex justify-between">
                    <span>Tempo Médio:</span>
                    <span className="font-semibold text-neutral-900">{platform.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custo Estimado:</span>
                    <span className="font-semibold text-neutral-900">{platform.cost}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dica do Especialista de Angola */}
            <Card className={`border-2 ${platform.borderColor} ${platform.bgColor} overflow-hidden shadow-xs`}>
              <CardHeader className="py-4 pb-2">
                <CardTitle className="text-base font-headline font-bold flex items-center gap-2 text-neutral-900">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Dica de Utilização
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-sm text-neutral-800 leading-relaxed font-medium">
                  &ldquo;{platform.proTip}&rdquo;
                </p>
              </CardContent>
            </Card>

            {/* Instruções de Carregamento em Kwanzas */}
            <Card className="border-neutral-200/80 shadow-xs">
              <CardHeader className="bg-neutral-50/50 border-b py-4">
                <CardTitle className="text-base font-headline font-semibold flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  O Fluxo do Dinheiro
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-sm text-neutral-700 leading-relaxed">
                <p className="text-xs text-muted-foreground">
                  Como enviar os seus Kwanzas de Angola para pagar sites internacionais:
                </p>
                <div className="space-y-3 mt-2 text-xs font-semibold">
                  <div className="flex items-center gap-2 bg-neutral-50 p-2.5 rounded-lg border">
                    <span className="h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                    <span>Kz no seu banco (BAI/BFA)</span>
                  </div>
                  <div className="flex justify-center">
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 bg-neutral-50 p-2.5 rounded-lg border">
                    <span className="h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                    <span>Binance P2P (Kz vira USDT)</span>
                  </div>
                  <div className="flex justify-center">
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 bg-neutral-50 p-2.5 rounded-lg border">
                    <span className="h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px]">3</span>
                    <span>Redotpay Pay (Carrega o Cartão)</span>
                  </div>
                  <div className="flex justify-center">
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 bg-primary/10 text-primary p-2.5 rounded-lg border border-primary/20">
                    <span className="h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px]">4</span>
                    <span>Compra Virtual em qualquer site!</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Guia de Segurança contra Burlas */}
        <Card className="border-amber-200 bg-amber-50/30 overflow-hidden shadow-xs">
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start gap-5">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-full shrink-0">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-headline font-bold text-amber-950">
                Atenção: Manual de Segurança Contra Burlas no P2P
              </h3>
              <p className="text-sm text-amber-900/90 leading-relaxed">
                As negociações Peer-to-Peer (P2P) na Binance, Bybit e AirTM são extremamente seguras porque a plataforma retém a criptomoeda em segurança (garantia de custódia). No entanto, <strong>nunca envie criptomoedas antes de ver o dinheiro na sua conta bancária</strong>. Se for comprar, pague sempre a partir de uma conta com o mesmo nome registado na Binance e nunca mencione palavras como &apos;cripto&apos; ou &apos;Binance&apos; na descrição da transferência bancária.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Secção de Dúvidas Expandível (Faq) */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h2 className="text-2xl font-headline font-bold text-center flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Perguntas Frequentes em Angola
          </h2>
          <div className="space-y-3">
            {[
              {
                q: 'Posso utilizar o Bilhete de Identidade de Angola para abrir estas contas?',
                a: 'Sim! Plataformas como Redotpay, Binance, Bybit e AirTM aceitam plenamente o Bilhete de Identidade (BI) de Angola nítido e válido para verificação de KYC. A Wise prefere o Passaporte, sendo este o mais recomendado para contas bancárias europeias.'
              },
              {
                q: 'O cartão virtual tem custos mensais ou taxas de manutenção?',
                a: 'A Redotpay e a Wise não cobram mensalidades de manutenção. O cartão virtual da Redotpay tem um custo único de criação de $10 USD. O cartão digital da Wise é gratuito após a ativação com depósito inicial. O cartão AirTM custa $4.95 USD para emissão.'
              },
              {
                q: 'Como funcionam os pagamentos online em Kwanza (AOA)?',
                a: 'Como os bancos angolanos possuem limites apertados para pagamentos internacionais, o método ideal é converter os seus Kwanzas em USDT (Dólar Digital estável) no mercado P2P da Binance ou Bybit. Depois, envia esse USDT para carregar o seu cartão Visa virtual que pagará em Dólares ou Euros de forma transparente.'
              },
              {
                q: 'Estes cartões funcionam no Apple Pay ou Google Pay?',
                a: 'Sim! Tanto a Wise como a Redotpay suportam totalmente integração com Apple Pay e Google Pay. No entanto, lembre-se que para adicionar ao Apple Pay em Angola, o ID Apple ou a região do telemóvel deve estar configurada para um país que suporte o Apple Pay (como Portugal ou Estados Unidos).'
              }
            ].map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div key={idx} className="bg-card border border-neutral-200/80 rounded-xl overflow-hidden transition-colors">
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    className="w-full text-left px-5 py-4 font-semibold text-neutral-900 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                    id={`faq-trigger-${idx}`}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground border-t border-neutral-100 leading-relaxed bg-neutral-50/30">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
