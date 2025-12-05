import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

// URL fixa do domínio publicado
const PUBLIC_URL = 'https://clubedelazershangrila.com.br';

interface QRCodeGeneratorProps {
  tableId: string;
  tableName: string;
  tableNumber: number;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  tableId,
  tableName,
  tableNumber
}) => {
  const menuUrl = `${PUBLIC_URL}/mesa/${tableId}`;

  const downloadQRCode = () => {
    const svg = document.getElementById(`qr-${tableId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 480;
      
      if (ctx) {
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code
        ctx.drawImage(img, 50, 50, 300, 300);
        
        // Add text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Mesa ${tableNumber}`, canvas.width / 2, 400);
        ctx.font = '16px sans-serif';
        ctx.fillText(tableName, canvas.width / 2, 430);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText('Escaneie para ver o cardápio', canvas.width / 2, 460);
      }

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-mesa-${tableNumber}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const openMenuLink = () => {
    window.open(menuUrl, '_blank');
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg">
      <QRCodeSVG
        id={`qr-${tableId}`}
        value={menuUrl}
        size={150}
        level="H"
        includeMargin
      />
      <p className="text-xs text-muted-foreground text-center break-all max-w-[180px]">
        {menuUrl}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={downloadQRCode}>
          <Download className="h-4 w-4 mr-1" />
          Baixar
        </Button>
        <Button size="sm" variant="ghost" onClick={openMenuLink}>
          <ExternalLink className="h-4 w-4 mr-1" />
          Abrir
        </Button>
      </div>
    </div>
  );
};
