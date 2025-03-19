import React, { useState } from 'react';

interface UserProps {
    name?: string;
    avatarUrl?: string;
    isLoggedIn?: boolean;
}

interface NavbarProps {
    user?: UserProps;
    logoSrc?: string;
    logoAlt?: string;
    onLogin?: () => void;
    onLogout?: () => void;
    onProfile?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
                                           user = { name: 'Guest', avatarUrl: '', isLoggedIn: false },
                                           logoSrc = '/logo.svg',
                                           logoAlt = 'App Logo',
                                           onLogin = () => console.log('Login clicked'),
                                           onLogout = () => console.log('Logout clicked'),
                                           onProfile = () => console.log('Profile clicked')
                                       }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    // Fermeture du modal au clic en dehors
    const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setIsModalOpen(false);
        }
    };

    return (
        <nav className="fixed top-0 left-0 w-full bg-white shadow-md py-3 px-6 z-40">
            <div className="flex justify-between items-center">
                {/* Section utilisateur (à gauche) */}
                <div className="flex items-center space-x-3 relative">
                    <div
                        className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={toggleModal}
                    >
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="User Avatar" className="h-full w-full object-cover" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.name}</span>

                    {/* Modal utilisateur */}
                    {isModalOpen && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-start justify-start"
                            onClick={handleOutsideClick}
                        >
                            <div className="bg-white rounded-lg shadow-lg mt-16 ml-6 w-64 overflow-hidden">
                                <div className="p-4 border-b border-gray-200">
                                    <h3 className="font-medium text-gray-900">Compte utilisateur</h3>
                                </div>
                                <div className="p-2">
                                    {!user.isLoggedIn ? (
                                        <button
                                            onClick={() => {
                                                onLogin();
                                                setIsModalOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 0v12h12V3H5z" clipRule="evenodd" />
                                                <path fillRule="evenodd" d="M10 9a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1z" clipRule="evenodd" />
                                                <path fillRule="evenodd" d="M7 12a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
                                            </svg>
                                            Connexion
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    onProfile();
                                                    setIsModalOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center gap-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                                Mon profil
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onLogout();
                                                    setIsModalOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4a1 1 0 10-2 0v6.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L14 13.586V7z" clipRule="evenodd" />
                                                </svg>
                                                Déconnexion
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Logo (au centre) */}
                <div className="absolute left-1/2 transform -translate-x-1/2">
                    <img src={logoSrc} alt={logoAlt} className="h-8" />
                </div>

                {/* Espace vide à droite pour équilibrer le layout */}
                <div className="w-24"></div>
            </div>
        </nav>
    );
};

export default Navbar;