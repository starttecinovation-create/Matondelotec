'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrainCircuit, Calculator, Puzzle, PiggyBank, Blocks } from 'lucide-react';

function ActivityCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                    <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className="mt-1">{description}</CardDescription>
                </div>
            </CardHeader>
        </Card>
    )
}

export default function KidsPage() {
    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-primary/10 rounded-full">
                           <BrainCircuit className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">Espaço Kanucos</h1>
                    <p className="text-muted-foreground mt-4 text-lg">
                        Um mundo de atividades divertidas para estimular o desenvolvimento e a criatividade dos kanucos.
                    </p>
                </div>
                
                <Tabs defaultValue="2-4" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="2-4">2-4 Anos</TabsTrigger>
                        <TabsTrigger value="5-8">5-8 Anos</TabsTrigger>
                        <TabsTrigger value="9-12">9-12 Anos</TabsTrigger>
                    </TabsList>
                    <TabsContent value="2-4" className="mt-6">
                        <div className="grid md:grid-cols-2 gap-6">
                           <ActivityCard icon={Blocks} title="Montagem de Legos" description="Use blocos físicos para construir torres, casas e o que a imaginação permitir. Desenvolve a coordenação motora e o reconhecimento de formas." />
                           <ActivityCard icon={Puzzle} title="Quebra-cabeças Simples" description="Comece com quebra-cabeças de 2 a 4 peças grandes. Ajuda a desenvolver a percepção visual e a resolução de problemas." />
                           <ActivityCard icon={Blocks} title="Pintura e Desenho Livre" description="Use papel e lápis de cor para explorar a criatividade. Uma ótima atividade sensorial e criativa!" />
                           <ActivityCard icon={Calculator} title="Contar Objetos" description="Conte brinquedos, frutas ou dedos. Associe os números a quantidades reais para uma introdução divertida à matemática." />
                        </div>
                    </TabsContent>
                    <TabsContent value="5-8" className="mt-6">
                         <div className="grid md:grid-cols-2 gap-6">
                           <ActivityCard icon={Calculator} title="Matemática Simples" description="Pratique somas e subtrações com objetos reais (Ex: 3 maçãs + 2 maçãs). Torne a matemática numa aventura do dia a dia!" />
                           <ActivityCard icon={Blocks} title="Construções Criativas com Legos" description="Desafie a criança a construir um carro, um avião ou um animal. Incentive a criatividade e a capacidade de seguir instruções simples." />
                           <ActivityCard icon={PiggyBank} title="Educação Financeira: O Mealheiro" description="Introduza a ideia de poupança com um mealheiro. Explique que guardar moedas hoje permite comprar algo especial amanhã. Ensine o valor da paciência." />
                           <ActivityCard icon={Puzzle} title="Quebra-cabeças Médios" description="Aumente o desafio com quebra-cabeças de 20 a 50 peças. Ótimo para desenvolver a concentração, a paciência e o pensamento lógico." />
                        </div>
                    </TabsContent>
                    <TabsContent value="9-12" className="mt-6">
                         <div className="grid md:grid-cols-2 gap-6">
                           <ActivityCard icon={PiggyBank} title="Educação Financeira: Necessidades vs. Desejos" description="Converse sobre a diferença entre o que 'precisamos' (comida, casa) e o que 'queremos' (brinquedos, jogos). Defina metas de poupança para um item desejado." />
                           <ActivityCard icon={Calculator} title="Desafios de Matemática" description="Introduza a multiplicação e a divisão através de problemas práticos, como dividir uma pizza por amigos ou calcular o custo de vários itens." />
                           <ActivityCard icon={Blocks} title="Projetos de Engenharia com Legos" description="Tente construir estruturas mais complexas como pontes ou edifícios, aprendendo sobre equilíbrio, suporte e planeamento." />
                           <ActivityCard icon={Puzzle} title="Jogos de Estratégia e Lógica" description="Experimente jogos de tabuleiro que exijam estratégia, como xadrez, damas ou outros jogos de lógica, para desenvolver o planeamento a longo prazo." />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}