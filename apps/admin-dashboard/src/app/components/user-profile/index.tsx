"use client";
import Image from "next/image"
import CardBox from "../shared/CardBox"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, configureApiClient, type AuthProfile } from "@volteryde/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { API_CONFIG } from "@/config/api";
import { useAuth } from "@/providers/AuthProvider";

const UserProfile = () => {
    const { accessToken } = useAuth();
    const [openModal, setOpenModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<AuthProfile | null>(null);

    const BCrumb = [
        { to: "/", title: "Home" },
        { title: "User Profile" },
    ];

    // Configure API client and fetch profile when the token is available.
    // Both must live in a single effect to guarantee the client is
    // configured BEFORE the fetch fires (eliminates the race condition
    // between two independent useEffect hooks).
    useEffect(() => {
        configureApiClient({
            baseUrl: API_CONFIG.authService.baseUrl,
            getAccessToken: async () => accessToken,
        });

        if (!accessToken) {
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        async function fetchProfile() {
            setIsLoading(true);
            setError(null);

            try {
                const data = await authApi.getProfile();
                if (!cancelled) setProfile(data);
            } catch (err: unknown) {
                if (cancelled) return;
                // ApiError from the client is a plain object, not an Error
                const msg =
                    err instanceof Error
                        ? err.message
                        : typeof err === 'object' && err !== null && 'message' in err
                            ? String((err as { message: unknown }).message)
                            : 'Unknown error';
                console.error('Failed to fetch profile:', msg, err);
                setError(msg);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchProfile();

        return () => { cancelled = true; };
    }, [accessToken]);

    const firstName = profile?.firstName || '';
    const lastName = profile?.lastName || '';
    const email = profile?.email || '';
    const phone = profile?.phoneNumber || '';
    const roles = profile?.roles?.join(', ') || '';
    const accessId = profile?.accessId || '';
    const avatarUrl = profile?.avatarUrl || "/images/profile/user-1.jpg";

    const [personal, setPersonal] = useState({
        firstName,
        lastName,
        email,
        phone,
    });

    // Update local state when profile loads
    useEffect(() => {
        if (profile) {
            setPersonal({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                email: profile.email || '',
                phone: profile.phoneNumber || '',
            });
        }
    }, [profile]);

    const [tempPersonal, setTempPersonal] = useState(personal);

    useEffect(() => {
        if (openModal) {
            setTempPersonal(personal);
        }
    }, [openModal, personal]);

    const handleSave = async () => {
        // TODO: Implement profile update endpoint in auth-service
        setPersonal(tempPersonal);
        setOpenModal(false);
    };

    // Loading state
    if (isLoading) {
        return (
            <>
                <BreadcrumbComp title="User Profile" items={BCrumb} />
                <div className="flex flex-col gap-6">
                    <CardBox className="p-6">
                        <div className="flex items-center gap-6">
                            <Skeleton className="w-20 h-20 rounded-full" />
                            <div className="flex flex-col gap-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    </CardBox>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="space-y-6 rounded-xl border border-defaultBorder p-6">
                            <Skeleton className="h-6 w-40" />
                            <div className="grid grid-cols-2 gap-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i}><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-5 w-32" /></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <BreadcrumbComp title="User Profile" items={BCrumb} />
            <div className="flex flex-col gap-6">
                <CardBox className="p-6 overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-center gap-6 rounded-xl relative w-full break-words">
                        <div>
                            <Image
                                src={avatarUrl}
                                alt="profile"
                                width={80}
                                height={80}
                                className="rounded-full"
                                unoptimized={avatarUrl.startsWith('http')}
                            />
                        </div>
                        <div className="flex flex-wrap gap-4 justify-center sm:justify-between items-center w-full">
                            <div className="flex flex-col sm:text-left text-center gap-1.5">
                                <h5 className="card-title">{firstName} {lastName}</h5>
                                <div className="flex flex-wrap items-center gap-1 md:gap-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{roles}</p>
                                    {error && (
                                        <p className="text-xs text-amber-500">(Limited data - {error})</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardBox>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="space-y-6 rounded-xl border border-defaultBorder md:p-6 p-4 relative w-full break-words">
                        <h5 className="card-title">Personal Information</h5>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                            <div><p className="text-xs text-gray-500">First Name</p><p>{personal.firstName || '-'}</p></div>
                            <div><p className="text-xs text-gray-500">Last Name</p><p>{personal.lastName || '-'}</p></div>
                            <div><p className="text-xs text-gray-500">Email</p><p>{personal.email || '-'}</p></div>
                            <div><p className="text-xs text-gray-500">Phone</p><p>{personal.phone || '-'}</p></div>
                            <div><p className="text-xs text-gray-500">Roles</p><p>{roles || '-'}</p></div>
                        </div>
                    </div>

                    <div className="space-y-6 rounded-xl border border-defaultBorder md:p-6 p-4 relative w-full break-words">
                        <h5 className="card-title">Account Details</h5>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                            <div><p className="text-xs text-gray-500">Access ID</p><p className="text-sm font-mono">{accessId || '-'}</p></div>
                            <div><p className="text-xs text-gray-500">Email Verified</p><p>{profile?.emailVerified ? 'Yes' : 'No'}</p></div>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={openModal} onOpenChange={setOpenModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="mb-4">Edit Personal Information</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                placeholder="First Name"
                                value={tempPersonal.firstName}
                                onChange={(e) => setTempPersonal({ ...tempPersonal, firstName: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                placeholder="Last Name"
                                value={tempPersonal.lastName}
                                onChange={(e) => setTempPersonal({ ...tempPersonal, lastName: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                placeholder="Email"
                                value={tempPersonal.email}
                                disabled
                                className="bg-muted"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                placeholder="Phone"
                                value={tempPersonal.phone}
                                onChange={(e) => setTempPersonal({ ...tempPersonal, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 mt-4">
                        <Button color={"primary"} className="rounded-md" onClick={handleSave}>
                            Save Changes
                        </Button>
                        <Button
                            color={"lighterror"}
                            className="rounded-md bg-lighterror dark:bg-darkerror text-error hover:bg-error hover:text-white"
                            onClick={() => setOpenModal(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default UserProfile;
