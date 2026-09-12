'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Calculator, Puzzle, PiggyBank, Blocks, Trophy, Sparkles, CheckCircle2, RefreshCw, XCircle, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Simple custom confetti effect using Tailwind
function ScoreConfetti() {
    return (
        <div className="absolute inset-0 pointer-events-none flex justify-center items-center overflow-hidden z-10">
            <div className="absolute animate-ping h-24 w-24 rounded-full bg-yellow-400/20" />
            <div className="absolute animate-bounce text-xl left-[20%] top-[20%]">🎉</div>
            <div className="absolute animate-bounce text-xl right-[20%] top-[30%]">✨</div>
            <div className="absolute animate-bounce text-xl left-[35%] bottom-[20%]">⭐</div>
            <div className="absolute animate-bounce text-xl right-[40%] top-[15%]">🎈</div>
        </div>
    );
}

export default function KidsPage() {
    const { toast } = useToast();
    
    // --- GAME 1 STATE (2-4 Anos - Counting Game) ---
    const [countTarget, setCountTarget] = useState(3);
    const [countEmoji, setCountEmoji] = useState('🍎');
    const [countOptions, setCountOptions] = useState<number[]>([]);
    const [countScore, setCountScore] = useState(0);
    const [countGameState, setCountGameState] = useState<'playing' | 'success' | 'fail'>('playing');
    const [countSelected, setCountSelected] = useState<number | null>(null);

    // --- GAME 2 STATE (5-8 Anos - Math Game) ---
    const [mathNum1, setMathNum1] = useState(4);
    const [mathNum2, setMathNum2] = useState(3);
    const [mathOp, setMathOp] = useState<'+' | '-'>('+');
    const [mathOptions, setMathOptions] = useState<number[]>([]);
    const [mathScore, setMathScore] = useState(0);
    const [mathGameState, setMathGameState] = useState<'playing' | 'success' | 'fail'>('playing');
    const [mathSelected, setMathSelected] = useState<number | null>(null);

    // --- GAME 3 STATE (9-12 Anos - Finance Literacy Game) ---
    const financeItems = [
        { name: 'Água Potável 💧', type: 'necessity', desc: 'Indispensável para a vida e saúde humana.' },
        { name: 'Consola de Videojogos 🎮', type: 'want', desc: 'Divertido, mas não essencial para a sobrevivência.' },
        { name: 'Frutas e Legumes 🥦', type: 'necessity', desc: 'Comida saudável necessária para nutrir o nosso corpo.' },
        { name: 'Sapatilhas de Marca Super Caras 👟', type: 'want', desc: 'Precisamos de sapatos, mas não do par mais caro e luxuoso.' },
        { name: 'Livros de Estudo 📚', type: 'necessity', desc: 'Educação é essencial para desenvolveres o teu futuro.' },
        { name: 'Rebuçados e Chocolates 🍫', type: 'want', desc: 'Doces são gostosos, mas não fazem bem se comermos como comida.' },
    ];
    const [financeIdx, setFinanceIdx] = useState(0);
    const [financeScore, setFinanceScore] = useState(0);
    const [financeAnswered, setFinanceAnswered] = useState<boolean>(false);
    const [financeCorrect, setFinanceCorrect] = useState<boolean | null>(null);

    // Initial load for games
    useEffect(() => {
        generateCountingGame();
        generateMathGame();
    }, []);

    // --- GENERATORS ---
    const generateCountingGame = () => {
        const target = Math.floor(Math.random() * 5) + 1; // 1 to 5
        const emojis = ['🍎', '🧸', '⭐', '🚗', '🦁', '🎈'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        // Generate options (always include target, no duplicates)
        const optsSet = new Set<number>([target]);
        while (optsSet.size < 3) {
            optsSet.add(Math.floor(Math.random() * 5) + 1);
        }
        
        setCountTarget(target);
        setCountEmoji(emoji);
        setCountOptions(Array.from(optsSet).sort((a, b) => a - b));
        setCountGameState('playing');
        setCountSelected(null);
    };

    const generateMathGame = () => {
        const op = Math.random() > 0.5 ? '+' : '-';
        let n1 = 0;
        let n2 = 0;
        let ans = 0;

        if (op === '+') {
            n1 = Math.floor(Math.random() * 5) + 1; // 1 to 5
            n2 = Math.floor(Math.random() * 4) + 1; // 1 to 4
            ans = n1 + n2;
        } else {
            n1 = Math.floor(Math.random() * 5) + 5; // 5 to 9
            n2 = Math.floor(Math.random() * 4) + 1; // 1 to 4
            ans = n1 - n2;
        }

        const optsSet = new Set<number>([ans]);
        while (optsSet.size < 3) {
            optsSet.add(Math.max(1, ans + Math.floor(Math.random() * 5) - 2));
        }

        setMathNum1(n1);
        setMathNum2(n2);
        setMathOp(op);
        setMathOptions(Array.from(optsSet).sort((a, b) => a - b));
        setMathGameState('playing');
        setMathSelected(null);
    };

    // --- ACTIONS ---
    const handleCountAnswer = (ans: number) => {
        setCountSelected(ans);
        if (ans === countTarget) {
            setCountScore(prev => prev + 10);
            setCountGameState('success');
            toast({ title: "Boa, campeão! 🌟", description: "Acertaste em cheio na contagem!" });
        } else {
            setCountGameState('fail');
        }
    };

    const handleMathAnswer = (ans: number) => {
        setMathSelected(ans);
        const correctAns = mathOp === '+' ? (mathNum1 + mathNum2) : (mathNum1 - mathNum2);
        if (ans === correctAns) {
            setMathScore(prev => prev + 15);
            setMathGameState('success');
            toast({ title: "Fantástico! 🧠", description: "A tua resposta está correta!" });
        } else {
            setMathGameState('fail');
        }
    };

    const handleFinanceAnswer = (type: 'necessity' | 'want') => {
        if (financeAnswered) return;
        const currentItem = financeItems[financeIdx];
        const isCorrect = currentItem.type === type;
        
        setFinanceAnswered(true);
        setFinanceCorrect(isCorrect);
        if (isCorrect) {
            setFinanceScore(prev => prev + 20);
            toast({ title: "Parabéns! 💡", description: "Fizeste uma excelente escolha financeira." });
        }
    };

    const nextFinanceItem = () => {
        setFinanceAnswered(false);
        setFinanceCorrect(null);
        setFinanceIdx(prev => (prev + 1) % financeItems.length);
    };

    return (
        <div className="container mx-auto px-4 py-8 md:py-12 bg-gradient-to-b from-[#FFFDF5] to-background">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Visual Header Block */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 bg-amber-100 rounded-full text-amber-500 shadow-xs relative">
                            <BrainCircuit className="w-12 h-12 text-[#D45500] animate-pulse" />
                            <Sparkles className="absolute -top-1 -right-1 text-yellow-400 animate-bounce" />
                        </div>
                    </div>
                    <h1 className="font-headline text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
                        Espaço Kanucos
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Aprende a jogar! Um espaço interativo e divertido com minijogos desenhados para treinar a lógica, matemática e finanças dos nossos kanucos.
                    </p>
                </div>

                <Tabs defaultValue="2-4" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto bg-amber-50 rounded-lg p-1 border border-amber-100">
                        <TabsTrigger value="2-4" className="text-xs md:text-sm font-bold py-2">Kanucos (2-4 Anos)</TabsTrigger>
                        <TabsTrigger value="5-8" className="text-xs md:text-sm font-bold py-2">Crescidos (5-8 Anos)</TabsTrigger>
                        <TabsTrigger value="9-12" className="text-xs md:text-sm font-bold py-2">Gurus (9-12 Anos)</TabsTrigger>
                    </TabsList>

                    {/* TAB 1: KANUCOS 2-4 ANOS - COUNTING GAME */}
                    <TabsContent value="2-4" className="mt-8 animate-in fade-in-50 duration-300">
                        <Card className="border-amber-200 shadow-md relative overflow-hidden bg-white">
                            {countGameState === 'success' && <ScoreConfetti />}
                            <CardHeader className="bg-amber-50/50 border-b border-amber-100/50">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Blocks className="h-5 w-5 text-[#D45500]" />
                                        <CardTitle className="text-base font-bold text-slate-800">Quantos objetos vês?</CardTitle>
                                    </div>
                                    <Badge className="bg-amber-100 text-amber-800 font-bold">Estrelas: {countScore} ⭐</Badge>
                                </div>
                                <CardDescription>Conta os objetos bonitos no ecrã e clica no número correto!</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 flex flex-col items-center justify-center space-y-8 min-h-[250px]">
                                {/* Rendered Emojis */}
                                <div className="flex flex-wrap items-center justify-center gap-4 py-6 px-8 rounded-2xl bg-amber-50/20 border-2 border-dashed border-amber-200">
                                    {Array.from({ length: countTarget }).map((_, idx) => (
                                        <span key={idx} className="text-5xl md:text-6xl select-none animate-bounce" style={{ animationDelay: `${idx * 150}ms` }}>
                                            {countEmoji}
                                        </span>
                                    ))}
                                </div>

                                {/* Options Buttons */}
                                {countGameState === 'playing' ? (
                                    <div className="flex gap-4 justify-center">
                                        {countOptions.map(opt => (
                                            <Button
                                                key={opt}
                                                size="lg"
                                                onClick={() => handleCountAnswer(opt)}
                                                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300 rounded-2xl font-bold text-2xl h-16 w-16 shadow-xs"
                                            >
                                                {opt}
                                            </Button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4">
                                        {countGameState === 'success' ? (
                                            <div className="flex flex-col items-center gap-2 text-emerald-600 font-bold">
                                                <CheckCircle2 className="h-12 w-12" />
                                                <p className="text-lg">Incrível! Viste exatamente {countTarget} {countTarget > 1 ? 'objetos' : 'objeto'}!</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-red-500 font-bold">
                                                <XCircle className="h-12 w-12" />
                                                <p className="text-lg">Quase lá! Tenta outra vez!</p>
                                            </div>
                                        )}
                                        <Button onClick={generateCountingGame} className="bg-amber-500 hover:bg-amber-600 text-white font-bold gap-2 rounded-xl">
                                            <RefreshCw className="h-4 w-4" /> Jogar Novamente
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 2: CRESCIDOS 5-8 ANOS - MATH ADVENTURE */}
                    <TabsContent value="5-8" className="mt-8 animate-in fade-in-50 duration-300">
                        <Card className="border-sky-200 shadow-md relative overflow-hidden bg-white">
                            {mathGameState === 'success' && <ScoreConfetti />}
                            <CardHeader className="bg-sky-50/50 border-b border-sky-100/50">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Calculator className="h-5 w-5 text-sky-600" />
                                        <CardTitle className="text-base font-bold text-slate-800">Aventura dos Números</CardTitle>
                                    </div>
                                    <Badge className="bg-sky-100 text-sky-800 font-bold">Pontuação: {mathScore} 🧠</Badge>
                                </div>
                                <CardDescription>Resolve a conta matemática rápida para ganhares pontos!</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 flex flex-col items-center justify-center space-y-8 min-h-[250px]">
                                {/* Equation Card */}
                                <div className="p-6 rounded-2xl bg-sky-50 text-slate-800 border border-sky-100 font-bold text-4xl md:text-5xl flex items-center gap-4">
                                    <span>{mathNum1}</span>
                                    <span className="text-sky-500">{mathOp}</span>
                                    <span>{mathNum2}</span>
                                    <span className="text-slate-400">=</span>
                                    <span className="text-sky-600 animate-pulse">?</span>
                                </div>

                                {/* Answers */}
                                {mathGameState === 'playing' ? (
                                    <div className="flex gap-4 justify-center">
                                        {mathOptions.map(opt => (
                                            <Button
                                                key={opt}
                                                size="lg"
                                                onClick={() => handleMathAnswer(opt)}
                                                className="bg-sky-50 hover:bg-sky-100 text-sky-950 border-2 border-sky-200 rounded-2xl font-bold text-xl h-14 w-14 shadow-xs"
                                            >
                                                {opt}
                                            </Button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4">
                                        {mathGameState === 'success' ? (
                                            <div className="flex flex-col items-center gap-2 text-emerald-600 font-bold">
                                                <CheckCircle2 className="h-12 w-12" />
                                                <p className="text-lg">Parabéns! Resposta corretíssima!</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-red-500 font-bold">
                                                <XCircle className="h-12 w-12" />
                                                <p className="text-lg">Ups! Tenta fazer a conta com paciência.</p>
                                            </div>
                                        )}
                                        <Button onClick={generateMathGame} className="bg-sky-500 hover:bg-sky-600 text-white font-bold gap-2 rounded-xl">
                                            <RefreshCw className="h-4 w-4" /> Nova Conta
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 3: GURUS 9-12 ANOS - NEEDS VS WANTS FINANCIAL EDUCATION */}
                    <TabsContent value="9-12" className="mt-8 animate-in fade-in-50 duration-300">
                        <Card className="border-emerald-200 shadow-md relative overflow-hidden bg-white">
                            {financeAnswered && financeCorrect && <ScoreConfetti />}
                            <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/50">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <PiggyBank className="h-5 w-5 text-emerald-600" />
                                        <CardTitle className="text-base font-bold text-slate-800">Necessidade ou Desejo?</CardTitle>
                                    </div>
                                    <Badge className="bg-emerald-100 text-emerald-800 font-bold">Económico: {financeScore} 💰</Badge>
                                </div>
                                <CardDescription>Aprende o valor do dinheiro! Escolhe se o item abaixo é essencial ou opcional.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 flex flex-col items-center justify-center space-y-8 min-h-[250px]">
                                {/* Current Item Display */}
                                <div className="text-center space-y-3">
                                    <p className="text-xs font-bold uppercase text-emerald-600 tracking-wider">Item de Consumo:</p>
                                    <h3 className="text-3xl font-extrabold text-slate-800">{financeItems[financeIdx].name}</h3>
                                </div>

                                {/* Answer Interface */}
                                {!financeAnswered ? (
                                    <div className="flex gap-4 w-full max-w-sm justify-center">
                                        <Button
                                            size="lg"
                                            onClick={() => handleFinanceAnswer('necessity')}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-6 w-full rounded-2xl shadow-sm border border-emerald-400"
                                        >
                                            Necessidade 👍
                                        </Button>
                                        <Button
                                            size="lg"
                                            onClick={() => handleFinanceAnswer('want')}
                                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-6 w-full rounded-2xl shadow-sm border border-amber-400"
                                        >
                                            Desejo 🛍️
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="w-full max-w-md p-4 rounded-xl border bg-slate-50 text-center space-y-4">
                                        {financeCorrect ? (
                                            <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-lg">
                                                <CheckCircle2 className="h-6 w-6" /> Resposta Correta!
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2 text-red-500 font-bold text-lg">
                                                <XCircle className="h-6 w-6" /> Tenta refletir melhor!
                                            </div>
                                        )}
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {financeItems[financeIdx].desc}
                                        </p>
                                        <Button onClick={nextFinanceItem} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">
                                            Seguinte item ➔
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="bg-emerald-50/20 p-4 border-t text-xs text-center text-slate-500">
                                Dica: As <span className="font-bold text-emerald-600">Necessidades</span> são coisas sem as quais não conseguimos sobreviver. Os <span className="font-bold text-amber-600">Desejos</span> são coisas que gostávamos de ter, mas não são obrigatórias.
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
