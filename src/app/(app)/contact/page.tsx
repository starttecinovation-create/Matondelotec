
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Contacte-nos</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Tem alguma questão ou sugestão? Adoraríamos ouvir de si.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Enviar uma mensagem</CardTitle>
                        <CardDescription>Preencha o formulário e a nossa equipa responderá o mais breve possível.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" placeholder="O seu nome completo" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="O seu endereço de email" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="message">Mensagem</Label>
                            <Textarea id="message" placeholder="Escreva a sua mensagem aqui..." />
                        </div>
                        <Button className="w-full">Enviar Mensagem</Button>
                    </CardContent>
                </Card>
            </div>
             <div className="space-y-6">
                <h2 className="font-headline text-2xl font-semibold">Outras formas de contacto</h2>
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                            <Mail className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Email</h3>
                            <p className="text-muted-foreground">Para suporte geral, questões e parcerias.</p>
                            <a href="mailto:geral@matondelo.co.ao" className="text-primary hover:underline">geral@matondelo.co.ao</a>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                            <Phone className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Telefone</h3>
                            <p className="text-muted-foreground">Disponível de Segunda a Sexta, das 9h às 18h.</p>
                            <div className="flex flex-col space-y-1 mt-1">
                                <a href="tel:+244923618244" className="text-primary hover:underline">+244 923 61 82 44</a>
                                <a href="tel:+244941359379" className="text-primary hover:underline">+244 941 359 379</a>
                            </div>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                            <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Escritório</h3>
                            <p className="text-muted-foreground">Av. da Liberdade, nº 123, Luanda, Angola</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
