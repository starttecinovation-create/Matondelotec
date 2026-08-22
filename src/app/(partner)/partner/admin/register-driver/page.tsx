
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { setDoc, serverTimestamp, collection, doc, query, where, getDocs, writeBatch, increment } from 'firebase/firestore';
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Loader2, UserPlus, FileCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePartner } from '@/context/partner-context';
import type { UserProfile } from '@/lib/types';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Separator } from '@/components/ui/separator';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB for videos
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const fileSchema = z.any()
  .refine((files) => files?.[0], "O ficheiro é obrigatório.")
  .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `O tamanho máximo é 15MB.`)
  .refine(
    (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
    "Apenas ficheiros .jpg, .jpeg, .png, .webp e .pdf são aceites."
  );

const videoFileSchema = z.any()
    .refine((files) => files?.[0], "O vídeo é obrigatório.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `O tamanho máximo é 15MB.`)
    .refine(
        (files) => ACCEPTED_VIDEO_TYPES.includes(files?.[0]?.type),
        "Apenas ficheiros .mp4, .webm, ou .mov são aceites."
    );

const driverSignupSchema = z.object({
  displayName: z.string().min(3, 'O nome é obrigatório.'),
  email: z.string().email('Por favor, insira um email válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  driverType: z.enum(['taxi', 'moto_taxi', 'tow_truck', 'goods_vehicle'], { required_error: 'O tipo de motorista é obrigatório.'}),
  province: z.string().min(1, 'A província é obrigatória.'),
  city: z.string().min(1, 'A cidade é obrigatória.'),
  identityCard: fileSchema,
  drivingLicense: fileSchema,
  criminalRecord: fileSchema,
  vehicleRegistration: fileSchema,
  vehicleOwnership: fileSchema,
  selfieVideo: videoFileSchema,
  vehicleFrontVideo: videoFileSchema,
  vehicleSidesVideo: videoFileSchema,
  referralCode: z.string().optional(),
});

export default function RegisterDriverPage() {
    const router = useRouter();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { isAdmin } = usePartner();
    const [isUploading, setIsUploading] = useState(false);
    
    const form = useForm<z.infer<typeof driverSignupSchema>>({
        resolver: zodResolver(driverSignupSchema),
        defaultValues: {
            displayName: '',
            email: '',
            password: '',
            driverType: undefined,
            province: 'Luanda',
            city: 'Luanda',
            referralCode: '',
        },
    });
    
    const { isSubmitting } = form.formState;

    const fileToDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    const uploadFile = async (file: File, path: string): Promise<string> => {
        const storage = getStorage();
        const dataUrl = await fileToDataURL(file);
        const storageRef = ref(storage, path);
        await uploadString(storageRef, dataUrl, 'data_url');
        return await getDownloadURL(storageRef);
    }

    const handleSignup = async (values: z.infer<typeof driverSignupSchema>) => {
        if (!auth || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Erro de Configuração',
                description: 'A base de dados não está disponível.',
            });
            return;
        }

        setIsUploading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const firebaseUser = userCredential.user;

            await updateProfile(firebaseUser, { displayName: values.displayName });
            
            const batch = writeBatch(firestore);

            // Upload files
            const identityCardUrl = await uploadFile(values.identityCard[0], `users/${firebaseUser.uid}/documents/identity_card`);
            const drivingLicenseUrl = await uploadFile(values.drivingLicense[0], `users/${firebaseUser.uid}/documents/driving_license`);
            const criminalRecordUrl = await uploadFile(values.criminalRecord[0], `users/${firebaseUser.uid}/documents/criminal_record`);
            const vehicleRegistrationUrl = await uploadFile(values.vehicleRegistration[0], `users/${firebaseUser.uid}/documents/vehicle_registration`);
            const vehicleOwnershipUrl = await uploadFile(values.vehicleOwnership[0], `users/${firebaseUser.uid}/documents/vehicle_ownership`);
            const selfieVideoUrl = await uploadFile(values.selfieVideo[0], `users/${firebaseUser.uid}/videos/selfie`);
            const vehicleFrontVideoUrl = await uploadFile(values.vehicleFrontVideo[0], `users/${firebaseUser.uid}/videos/vehicle_front`);
            const vehicleSidesVideoUrl = await uploadFile(values.vehicleSidesVideo[0], `users/${firebaseUser.uid}/videos/vehicle_sides`);
            
            setIsUploading(false);
            
            // Handle referral agent
            if (values.referralCode) {
                const agentQuery = query(collection(firestore, 'users'), where('referralCode', '==', values.referralCode));
                const agentSnapshot = await getDocs(agentQuery);
                if (!agentSnapshot.empty) {
                    const agentDoc = agentSnapshot.docs[0];
                    batch.update(agentDoc.ref, { referralCount: increment(1) });
                }
            }

            const userProfileRef = doc(firestore, 'users', firebaseUser.uid);
            const userProfileData: Omit<UserProfile, 'id'> & { id: string } = {
                id: firebaseUser.uid,
                displayName: values.displayName,
                email: firebaseUser.email || "",
                role: 'driver',
                driverType: values.driverType,
                balance: 0,
                location: {
                    country: 'Angola',
                    province: values.province,
                    city: values.city,
                },
                createdAt: serverTimestamp() as any,
                verificationStatus: 'pending',
                userDocuments: {
                  identityCardUrl,
                  criminalRecordUrl,
                  drivingLicenseUrl,
                  vehicleRegistrationUrl,
                  vehicleOwnershipUrl,
                  selfieVideoUrl,
                  vehicleFrontVideoUrl,
                  vehicleSidesVideoUrl,
                },
                referredBy: values.referralCode || null,
            };
            
            batch.set(userProfileRef, userProfileData);
            
            await batch.commit();
            
            toast({
                title: "Motorista Registado!",
                description: `A conta para ${values.displayName} foi criada e os documentos foram enviados.`,
            });
            
            form.reset();
            router.push('/partner/admin');

        } catch (error: any) {
            setIsUploading(false);
            let description = 'Não foi possível criar a conta. Tente outro email.';
            if (error.code === 'auth/email-already-in-use') {
                description = 'Este email já está a ser utilizado.';
            } else if (error.code?.startsWith('storage/')) {
                description = 'Ocorreu um erro ao enviar os documentos. Tente novamente.';
            }
            
            toast({
                variant: 'destructive',
                title: 'Erro ao Registar Motorista',
                description: description,
            });
             errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: `users/(new_user)`,
                    operation: 'create',
                    requestResourceData: values,
                })
            );
        }
    };
    
    if (!isAdmin) {
        return (
             <div className="container mx-auto px-4 py-8 md:py-12">
                 <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Acesso Negado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Não tem permissão para aceder a esta página.</p>
                        </CardContent>
                    </Card>
                 </div>
            </div>
        )
    }
    
    const isLoading = isSubmitting || isUploading;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
             <div className="mb-8">
                <h1 className="font-headline text-3xl md:text-4xl font-bold flex items-center gap-3"><UserPlus/> Registar Novo Motorista</h1>
                <p className="text-muted-foreground mt-2">
                    Adicione um novo motorista à plataforma em nome da sua equipa de mobilização.
                </p>
            </div>
            <Card className="w-full">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSignup)}>
                        <CardHeader>
                            <CardTitle>Dados Pessoais e de Acesso</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField
                                control={form.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Nome Completo do Motorista</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nome Apelido" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Email do Motorista</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="motorista@email.com" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Senha Inicial</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </CardContent>

                        <CardHeader>
                            <CardTitle>Informação Profissional</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="driverType"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Tipo de Veículo</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o tipo de veículo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="taxi">Táxi (Ligeiro/Executivo)</SelectItem>
                                            <SelectItem value="moto_taxi">Mototáxi (Normal/Kupapata)</SelectItem>
                                            <SelectItem value="tow_truck">Reboque</SelectItem>
                                            <SelectItem value="goods_vehicle">Veículo de Mercadorias</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="province"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Província</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Luanda" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Cidade / Município</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Luanda" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             </div>
                        </CardContent>

                         <CardHeader>
                            <CardTitle>Documentos para Verificação</CardTitle>
                            <CardDescription>Formatos aceites: .pdf, .png, .jpg. Tamanho máximo: 15MB.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField
                                control={form.control}
                                name="identityCard"
                                render={({ field: { onChange, value, ...rest }}) => (
                                    <FormItem>
                                        <FormLabel>Bilhete de Identidade (BI)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="file" {...rest} onChange={(e) => onChange(e.target.files)} disabled={isLoading} className="pr-12" accept={ACCEPTED_IMAGE_TYPES.join(",")} />
                                                {value?.[0]?.name && <FileCheck className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="drivingLicense"
                                render={({ field: { onChange, value, ...rest }}) => (
                                    <FormItem>
                                        <FormLabel>Carta de Condução</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="file" {...rest} onChange={(e) => onChange(e.target.files)} disabled={isLoading} className="pr-12" accept={ACCEPTED_IMAGE_TYPES.join(",")} />
                                                {value?.[0]?.name && <FileCheck className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="criminalRecord"
                                render={({ field: { onChange, value, ...rest } }) => (
                                    <FormItem>
                                        <FormLabel>Registo Criminal</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="file" {...rest} onChange={(e) => onChange(e.target.files)} disabled={isLoading} className="pr-12" accept={ACCEPTED_IMAGE_TYPES.join(",")} />
                                                {value?.[0]?.name && <FileCheck className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>

                        <CardHeader>
                            <CardTitle>Documentos da Viatura</CardTitle>
                        </CardHeader>
                         <CardContent className="space-y-4">
                             <FormField
                                control={form.control}
                                name="vehicleRegistration"
                                render={({ field: { onChange, value, ...rest } }) => (
                                    <FormItem>
                                        <FormLabel>Livrete da Viatura</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="file" {...rest} onChange={(e) => onChange(e.target.files)} disabled={isLoading} className="pr-12" accept={ACCEPTED_IMAGE_TYPES.join(",")} />
                                                {value?.[0]?.name && <FileCheck className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="vehicleOwnership"
                                render={({ field: { onChange, value, ...rest } }) => (
                                    <FormItem>
                                        <FormLabel>Título de Propriedade da Viatura</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="file" {...rest} onChange={(e) => onChange(e.target.files)} disabled={isLoading} className="pr-12" accept={ACCEPTED_IMAGE_TYPES.join(",")} />
                                                {value?.[0]?.name && <FileCheck className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        
                        <CardHeader>
                            <CardTitle>Verificação por Vídeo</CardTitle>
                             <CardDescription>Formatos aceites: .mp4, .webm, .mov. Tamanho máximo: 15MB.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="selfieVideo"
                                render={({ field: { onChange, value, ...rest } }) => (
                                    <FormItem>
                                        <FormLabel>Vídeo do Rosto (Selfie)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="file" {...rest} onChange={(e) => onChange(e.target.files)} disabled={isLoading} className="pr-12" accept={ACCEPTED_VIDEO_TYPES.join(",")} />
                                                {value?.[0]?.name && <FileCheck className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="vehicleFrontVideo"
                                render={({ field: { onChange, value, ...rest } }) => (
                                    <FormItem>
                                        <FormLabel>Vídeo da Frente da Viatura</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="file" {...rest} onChange={(e) => onChange(e.target.files)} disabled={isLoading} className="pr-12" accept={ACCEPTED_VIDEO_TYPES.join(",")} />
                                                {value?.[0]?.name && <FileCheck className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="vehicleSidesVideo"
                                render={({ field: { onChange, value, ...rest } }) => (
                                    <FormItem>
                                        <FormLabel>Vídeo das Laterais da Viatura</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="file" {...rest} onChange={(e) => onChange(e.target.files)} disabled={isLoading} className="pr-12" accept={ACCEPTED_VIDEO_TYPES.join(",")} />
                                                {value?.[0]?.name && <FileCheck className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>

                        <CardHeader>
                            <CardTitle>Afiliação</CardTitle>
                        </CardHeader>
                         <CardContent>
                             <FormField
                                control={form.control}
                                name="referralCode"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Código de Indicação (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Código do agente que indicou este motorista" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isUploading ? 'A enviar documentos...' : isSubmitting ? 'A registar...' : 'Registar Motorista'}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    </div>
  );
}
