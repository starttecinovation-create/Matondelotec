'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, deleteDoc, query } from 'firebase/firestore';
import { type Professional, type Service, type WorkingShift } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { User, Plus, Trash2, Calendar, Clock, Check, AlertCircle } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Segunda-feira' },
  { id: 2, label: 'Terça-feira' },
  { id: 3, label: 'Quarta-feira' },
  { id: 4, label: 'Quinta-feira' },
  { id: 5, label: 'Sexta-feira' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
];

export default function ProfessionalsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [shifts, setShifts] = useState<WorkingShift[]>(
    DAYS_OF_WEEK.map((day) => ({
      dayOfWeek: day.id,
      start: '08:00',
      end: '18:00',
      active: day.id !== 0, // Sunday inactive by default
    }))
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const professionalsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/professionals`));
  }, [firestore, user]);

  const servicesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/services`));
  }, [firestore, user]);

  const { data: professionals, isLoading: isProLoading } = useCollection<Professional>(professionalsQuery);
  const { data: services, isLoading: isServicesLoading } = useCollection<Service>(servicesQuery);

  const handleToggleSpecialty = (serviceId: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleShiftChange = (dayOfWeek: number, field: 'start' | 'end' | 'active', value: any) => {
    setShifts((prev) =>
      prev.map((shift) =>
        shift.dayOfWeek === dayOfWeek ? { ...shift, [field]: value } : shift
      )
    );
  };

  const handleAddProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Nome Obrigatório', description: 'Por favor, indique o nome do profissional.' });
      return;
    }

    setIsSubmitting(true);
    const batch = writeBatch(firestore);
    const newProRef = doc(collection(firestore, `users/${user.uid}/professionals`));

    const proData: Professional = {
      id: newProRef.id,
      vendorId: user.uid,
      name,
      email,
      phone,
      isActive: true,
      specialties: selectedSpecialties,
      shifts,
    };

    try {
      batch.set(newProRef, proData);
      await batch.commit();

      toast({ title: 'Profissional Adicionado!', description: `${name} foi cadastrado com sucesso.` });
      
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setSelectedSpecialties([]);
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding professional: ', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível cadastrar o profissional.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProfessional = async (proId: string, proName: string) => {
    if (!user || !firestore) return;
    if (!confirm(`Tem a certeza que deseja remover o profissional ${proName}?`)) return;

    try {
      const proRef = doc(firestore, `users/${user.uid}/professionals/${proId}`);
      await deleteDoc(proRef);
      toast({ title: 'Profissional Removido', description: `${proName} foi removido com sucesso.` });
    } catch (error) {
      console.error('Error deleting professional: ', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover o profissional.' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12" id="professionals-dashboard">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold">Profissionais do Negócio</h1>
            <p className="text-muted-foreground mt-2">
              Cadastre os seus profissionais, defina as suas especialidades e horários/turnos de trabalho.
            </p>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} id="btn-add-professional">
              <Plus className="mr-2 h-4 w-4" /> Novo Profissional
            </Button>
          )}
        </div>

        {isAdding && (
          <Card className="border border-border shadow-md" id="add-professional-card">
            <form onSubmit={handleAddProfessional}>
              <CardHeader>
                <CardTitle>Adicionar Novo Profissional</CardTitle>
                <CardDescription>Configure o nome, contactos, serviços prestados e horários de trabalho.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pro-name">Nome Completo</Label>
                    <Input id="pro-name" placeholder="Ex: Carlos Silva" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pro-email">Email (Opcional)</Label>
                    <Input id="pro-email" type="email" placeholder="Ex: carlos@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pro-phone">Telemóvel (Opcional)</Label>
                    <Input id="pro-phone" placeholder="Ex: 923000000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-sm mb-3">Especialidades (Serviços que realiza)</h3>
                  {isServicesLoading ? (
                    <Skeleton className="h-12 w-full" />
                  ) : services && services.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {services.map((service) => {
                        const isChecked = selectedSpecialties.includes(service.id);
                        return (
                          <div
                            key={service.id}
                            onClick={() => handleToggleSpecialty(service.id)}
                            className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                              isChecked ? 'bg-primary/5 border-primary text-primary' : 'bg-background hover:bg-muted/50'
                            }`}
                          >
                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${isChecked ? 'bg-primary border-primary text-white' : 'border-input'}`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="text-xs font-medium truncate">{service.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Cadastre primeiro os seus serviços no separador &quot;Serviços&quot;.
                    </p>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-sm mb-4">Turnos & Horários de Trabalho</h3>
                  <div className="space-y-4">
                    {shifts.map((shift) => {
                      const dayLabel = DAYS_OF_WEEK.find((d) => d.id === shift.dayOfWeek)?.label;
                      return (
                        <div key={shift.dayOfWeek} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-4 bg-muted/10">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={shift.active}
                              onChange={(e) => handleShiftChange(shift.dayOfWeek, 'active', e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                              id={`active-${shift.dayOfWeek}`}
                            />
                            <Label htmlFor={`active-${shift.dayOfWeek}`} className="font-medium text-xs sm:text-sm cursor-pointer">{dayLabel}</Label>
                          </div>
                          {shift.active && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 bg-background border px-2.5 py-1.5 rounded-md shadow-sm">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                <input
                                  type="text"
                                  value={shift.start}
                                  onChange={(e) => handleShiftChange(shift.dayOfWeek, 'start', e.target.value)}
                                  className="w-12 text-xs font-semibold focus:outline-none bg-transparent"
                                  placeholder="09:00"
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">até</span>
                              <div className="flex items-center gap-1.5 bg-background border px-2.5 py-1.5 rounded-md shadow-sm">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                <input
                                  type="text"
                                  value={shift.end}
                                  onChange={(e) => handleShiftChange(shift.dayOfWeek, 'end', e.target.value)}
                                  className="w-12 text-xs font-semibold focus:outline-none bg-transparent"
                                  placeholder="18:00"
                                />
                              </div>
                            </div>
                          )}
                          {!shift.active && (
                            <span className="text-xs text-muted-foreground italic">Folga / Descanso</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t py-4 px-6 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setIsAdding(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'A Gravar...' : 'Gravar Profissional'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {isProLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
        ) : professionals && professionals.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {professionals.map((pro) => (
              <Card key={pro.id} className="hover:shadow-md transition-shadow duration-200 border border-border bg-card overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold">{pro.name}</CardTitle>
                        <CardDescription className="text-xs">{pro.phone || pro.email || 'Sem contactos cadastrados'}</CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProfessional(pro.id, pro.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Especialidades</span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {pro.specialties && pro.specialties.length > 0 ? (
                        pro.specialties.map((serviceId) => {
                          const serviceName = services?.find((s) => s.id === serviceId)?.name || 'Serviço';
                          return (
                            <span key={serviceId} className="px-2 py-0.5 rounded bg-muted text-[10px] font-semibold text-slate-700">
                              {serviceName}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Todas</span>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> Horários de Serviço
                    </span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1.5 text-xs text-slate-600">
                      {pro.shifts &&
                        pro.shifts
                          .filter((s) => s.active)
                          .map((shift) => {
                            const label = DAYS_OF_WEEK.find((d) => d.id === shift.dayOfWeek)?.label.substring(0, 3);
                            return (
                              <div key={shift.dayOfWeek} className="flex items-center justify-between border-b border-muted/30 py-0.5">
                                <span className="font-medium text-slate-500">{label}.</span>
                                <span className="font-semibold text-slate-700">{shift.start} - {shift.end}</span>
                              </div>
                            );
                          })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border rounded-lg bg-card">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Nenhum profissional cadastrado</h2>
            <p className="text-muted-foreground mt-2 mb-4">Adicione profissionais ao seu negócio para gerir os seus horários e receber agendamentos.</p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Primeiro Profissional
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
