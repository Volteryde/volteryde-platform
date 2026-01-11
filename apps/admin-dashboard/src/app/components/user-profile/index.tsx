"use client";
import Image from "next/image"
import CardBox from "../shared/CardBox"
import Link from "next/link"
import { Icon } from "@iconify/react/dist/iconify.js"
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
import { useUser } from "@/providers/AuthProvider";
import { usersApi, configureApiClient, type User } from "@volteryde/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { API_CONFIG } from "@/config/api";

const UserProfile = () => {
    const authUser = useUser();
    const [openModal, setOpenModal] = useState(false);
    const [modalType, setModalType] = useState<"personal" | "address" | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<User | null>(null);

    const BCrumb = [
        { to: "/", title: "Home" },
        { title: "User Profile" },
    ];

    // Configure API client with centralized config
    useEffect(() => {
        configureApiClient({
            baseUrl: API_CONFIG.userService.baseUrl,
        });
    }, []);

    useEffect(() => {
        async function fetchProfile() {
            if (!authUser?.id) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // Fetch user profile using authId (from JWT)
                const data = await usersApi.getUserByAuthId(authUser.id);
                setProfileData(data);
            } catch (err) {
                console.error('Failed to fetch user profile:', err);
                // Fall back to auth context data if API fails
                setError('Could not fetch full profile from server');
            } finally {
                setIsLoading(false);
            }
        }

        fetchProfile();
    }, [authUser?.id]);

    // Use profile data if available, otherwise fall back to auth context
    const firstName = profileData?.firstName || authUser?.firstName || '';
    const lastName = profileData?.lastName || authUser?.lastName || '';
    const email = profileData?.email || authUser?.email || '';
    const phone = profileData?.phoneNumber || '';
    const role = profileData?.role || (authUser?.roles?.[0] || 'USER');
    const avatarUrl = profileData?.profilePictureUrl || authUser?.avatarUrl || "/images/profile/user-1.jpg";

    const [personal, setPersonal] = useState({
        firstName,
        lastName,
        email,
        phone,
        position: role,
    });

    // Update local state when profile data loads
    useEffect(() => {
        if (profileData || authUser) {
            setPersonal({
                firstName: profileData?.firstName || authUser?.firstName || '',
                lastName: profileData?.lastName || authUser?.lastName || '',
                email: profileData?.email || authUser?.email || '',
                phone: profileData?.phoneNumber || '',
                position: profileData?.role || (authUser?.roles?.[0] || 'USER'),
            });
        }
    }, [profileData, authUser]);

    const [tempPersonal, setTempPersonal] = useState(personal);

    useEffect(() => {
        if (openModal && modalType === "personal") {
            setTempPersonal(personal);
        }
    }, [openModal, modalType, personal]);

    const handleSave = async () => {
        if (modalType === "personal" && profileData?.id) {
            try {
                // Update profile via API
                const updated = await usersApi.updateUser(profileData.id, {
                    firstName: tempPersonal.firstName,
                    lastName: tempPersonal.lastName,
                    phoneNumber: tempPersonal.phone,
                });
                setProfileData(updated);
                setPersonal(tempPersonal);
            } catch (err) {
                console.error('Failed to update profile:', err);
            }
        }
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
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
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
                            <div><p className="text-xs text-gray-500">Role</p><p>{personal.position || '-'}</p></div>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                onClick={() => { setModalType("personal"); setOpenModal(true); }}
                                color={"primary"}
                                className="flex items-center gap-1.5 rounded-md"
                                disabled={!profileData}
                            >
                                <Icon icon="ic:outline-edit" width="18" height="18" /> Edit
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-6 rounded-xl border border-defaultBorder md:p-6 p-4 relative w-full break-words">
                        <h5 className="card-title">Account Details</h5>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                            <div><p className="text-xs text-gray-500">User ID</p><p className="text-sm font-mono">{profileData?.id || authUser?.id || '-'}</p></div>
                            <div><p className="text-xs text-gray-500">Account Status</p><p>{profileData?.status || 'PENDING'}</p></div>
                            <div><p className="text-xs text-gray-500">Email Verified</p><p>{authUser?.emailVerified ? 'Yes' : 'No'}</p></div>
                            <div><p className="text-xs text-gray-500">Created</p><p>{profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : '-'}</p></div>
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
