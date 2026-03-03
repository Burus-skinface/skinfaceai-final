import React, { useState } from 'react';
import { GiftIcon } from './icons/GiftIcon';
import { CheckIcon } from './icons/CheckIcon';
import { t } from '../localization';

interface ReferralCardProps {
  userId: string;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ userId }) => {
  const [copied, setCopied] = useState(false);

  // Generate referral link
  const referralCode = userId.substring(0, 8).toUpperCase();
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-2xl border-2 border-yellow-500/30 p-6 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-yellow-500/20 rounded-lg">
          <GiftIcon className="w-6 h-6 text-yellow-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">Arkadaşını Davet Et, Pro+ Kazan</h3>
          <p className="text-sm text-gray-300">
            Özel davet kodunu arkadaşlarınla paylaş. Onlar ilk analizlerini yaptıklarında, ikiniz de 1 hafta ücretsiz Pro+ kazanın!
          </p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-black/30 rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-400 mb-2">DAVET KODUN</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/10 px-3 py-2 rounded-lg font-mono text-white text-sm">
            {referralCode}
          </div>
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${copied
                ? 'bg-green-500 text-white'
                : 'bg-yellow-500 text-black hover:bg-yellow-400'
              }`}
          >
            {copied ? (
              <>
                <CheckIcon className="w-4 h-4 inline mr-1" />
                Kopyalandı!
              </>
            ) : (
              'Kopyala'
            )}
          </button>
        </div>
      </div>

      {/* How it Works */}
      <div className="space-y-2">
        <div className="flex items-start gap-2 text-sm text-gray-300">
          <span className="text-yellow-400 font-bold">1.</span>
          <p>Bağlantıyı paylaş</p>
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-300">
          <span className="text-yellow-400 font-bold">2.</span>
          <p>Arkadaşın kaydolsun</p>
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-300">
          <span className="text-yellow-400 font-bold">3.</span>
          <p>Ödülünü kazan</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-yellow-500/20 flex items-center justify-between text-center">
        <div>
          <p className="text-2xl font-bold text-yellow-400">0</p>
          <p className="text-xs text-gray-400">Davet Edilen</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-yellow-400">0</p>
          <p className="text-xs text-gray-400">Kazanılan Hafta</p>
        </div>
      </div>
    </div>
  );
};

export default ReferralCard;

