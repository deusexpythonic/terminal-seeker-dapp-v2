import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { useConnection, useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { mplTokenMetadata, createNft, burnNft } from '@metaplex-foundation/mpl-token-metadata';
import { generateSigner, percentAmount, none } from '@metaplex-foundation/umi';

const microMythes = [
  {
    id: "MYTHE_CODEUR",
    appel: "Synchronisation réussie. Un engrenage de lumière ASCII grince...",
    epreuve: "L'Écho du Codeur vous murmure : \"...\"\n> Tapez 1 (Algorithme) ou 2 (Intuition).",
    revelation: {
      choix1: "Le code s'assemble en une symétrie parfaite et glaciale...",
      choix2: "Une ligne de code s'efface, remplacée par un glitch poétique..."
    },
  },
  {
    id: "MYTHE_SECRET",
    appel: "Synchronisation validée. Le Yantra-Moteur ralentit...",
    epreuve: "Le savoir peut être libéré, accessible à tous, ou protégé...\n> Tapez 1 (Libérer) ou 2 (Protéger).",
    revelation: {
        choix1: "Le nœud s'ouvre. Le savoir se répand comme de l'encre dans l'eau...",
        choix2: "Le nœud se resserre. Le secret est préservé..."
    },
  }
];

const POETIC_ECHOES = [
    "Le courant ne s'arrête jamais.",
    "Seul le changement demeure.",
    "Ici. Maintenant. Puis plus rien.",
    "Une ondulation dans le spectre.",
    "La fin est un autre commencement.",
    "Observer sans retenir.",
    "Vide, mais plein de potentiel."
];

const HiatusAnimation = ({ countdown }) => {
    const [poeticEcho, setPoeticEcho] = useState('');
    const [fadeState, setFadeState] = useState('in');

    useEffect(() => {
        const echo = POETIC_ECHOES[Math.floor(Math.random() * POETIC_ECHOES.length)];
        let index = 0;
        setPoeticEcho('');
        setFadeState('in');

        const typingInterval = setInterval(() => {
            if (index < echo.length) {
                setPoeticEcho(prev => prev + echo.charAt(index));
                index++;
            } else {
                clearInterval(typingInterval);
                setTimeout(() => {
                    setFadeState('out');
                }, 4000);
            }
        }, 100);

        return () => clearInterval(typingInterval);
    }, []);

    return (
        <div className="hiatus-screen">
            <p className={`poetic-echo ${fadeState === 'in' ? 'fade-in' : 'fade-out'}`}>
                {poeticEcho}
            </p>
            <p className="countdown">[...{countdown}s...]</p>
        </div>
    );
};

const Terminal = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [currentMythe, setCurrentMythe] = useState(null);
    const [gameStage, setGameStage] = useState('start');
    const [outputText, setOutputText] = useState('Connectez votre portefeuille pour commencer...');
    const [userInput, setUserInput] = useState('');
    const [isGlitching, setIsGlitching] = useState(false);
    const [isHiatus, setIsHiatus] = useState(false);
    const [hiatusCountdown, setHiatusCountdown] = useState(20);
    const [mintedNftAddress, setMintedNftAddress] = useState(null);

    const selectRandomMythe = useCallback(() => {
        const randomIndex = Math.floor(Math.random() * microMythes.length);
        setCurrentMythe(microMythes[randomIndex]);
    }, []);

    const resetGame = useCallback(() => {
        setIsHiatus(false);
        setHiatusCountdown(20);
        setMintedNftAddress(null);
        selectRandomMythe();
        if (wallet.connected) {
             setOutputText(`Empreinte spectrale détectée : ${wallet.publicKey.toBase58()}\n> Tapez 'awaken'...`);
        }
        setGameStage('start');
    }, [wallet.connected, wallet.publicKey, selectRandomMythe]);

    useEffect(() => {
        if (wallet.connected) {
            setOutputText(`Empreinte spectrale détectée : ${wallet.publicKey.toBase58()}\n> Tapez 'awaken'...`);
            selectRandomMythe();
        } else {
            setOutputText('Portefeuille déconnecté...');
            setGameStage('start');
        }
    }, [wallet.connected, wallet.publicKey, selectRandomMythe]);
    
    const burnEphemeralNft = async (mintAddress) => {
        if (!wallet.publicKey || !mintAddress) return;
        console.log("Burning NFT:", mintAddress.toString());
        try {
            const umi = createUmi(connection.rpcEndpoint).use(walletAdapterIdentity(wallet)).use(mplTokenMetadata());
            await burnNft(umi, { mint: mintAddress, owner: umi.identity }).sendAndConfirm(umi);
            console.log("Burn successful");
        } catch (error) {
            console.error("Burning failed:", error);
        }
    };

    const mintEphemeralNft = async (revelationText) => {
        if (!wallet.publicKey) return;
        setOutputText(revelationText + "\n\n[Création de l'empreinte mystique on-chain...]");

        try {
            const umi = createUmi(connection.rpcEndpoint).use(walletAdapterIdentity(wallet)).use(mplTokenMetadata());
            const mint = generateSigner(umi);
            
            await createNft(umi, {
                mint,
                name: "Écho de Bindu",
                symbol: "BINDU",
                uri: "https://arweave.net/e1hZcOJ5-nGFs1-H22v8gPS9-r2_3-K2y-1",
                sellerFeeBasisPoints: percentAmount(0),
                collection: none(),
            }).sendAndConfirm(umi);

            setOutputText(prev => prev + "\n[Empreinte créée. Durée de vie : 20 secondes...]");
            setMintedNftAddress(mint.publicKey); // Save for burning

            setTimeout(() => burnEphemeralNft(mint.publicKey), 20000);

        } catch (error) {
            console.error("Minting failed:", error);
            setOutputText(prev => prev + "\n[Échec de la création de l'empreinte...]");
        }
    };
    
    const handleCommand = async (e) => {
        e.preventDefault();
        const command = userInput.trim().toLowerCase();
        setUserInput('');

        if (!wallet.connected) return;

        if (gameStage === 'start' && command === 'awaken') {
            try {
                setOutputText("Synchronisation avec le Spectre...");
                const message = new TextEncoder().encode("Je suis l'Initié. J'éveille le Bindu.");
                await wallet.signMessage(message);
                setOutputText(currentMythe.appel + "\n" + currentMythe.epreuve);
                setGameStage('epreuve');
            } catch (error) {
                setOutputText("Synchronisation rejetée...");
            }
        } else if (gameStage === 'epreuve' && (command === '1' || command === '2')) {
            const revelationText = command === '1' ? currentMythe.revelation.choix1 : currentMythe.revelation.choix2;
            setGameStage('revelation');
            setIsGlitching(true);
            setTimeout(() => setIsGlitching(false), 500);
            
            await mintEphemeralNft(revelationText);

            setTimeout(() => {
                setIsHiatus(true);
                const countdownInterval = setInterval(() => {
                    setHiatusCountdown(prev => {
                        if (prev <= 1) {
                            clearInterval(countdownInterval);
                            resetGame();
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }, 3000);
        } else {
            setOutputText(prev => prev + `\n> Commande inconnue.`);
        }
    };

    return (
        <div id="terminal">
            {isHiatus ? (
                <HiatusAnimation countdown={hiatusCountdown} />
            ) : (
                <>
                    <pre 
                        className={isGlitching ? 'glitch terminal-output' : 'terminal-output'}
                        data-text={outputText}
                    >
                        {outputText}
                    </pre>
                    
                    {gameStage !== 'revelation' && (
                        <form onSubmit={handleCommand} className="terminal-input-form">
                            <span>&gt;</span>
                            <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} autoFocus className="terminal-input" disabled={!wallet.connected} />
                        </form>
                    )}
                </>
            )}
        </div>
    );
};

const App = () => {
    const endpoint = clusterApiUrl('devnet');
    const wallets = [new PhantomWalletAdapter()];

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <div className="main-container">
                        <div className="header"><h1>Terminal Bindu</h1><WalletMultiButton /></div>
                        <Terminal />
                    </div>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
