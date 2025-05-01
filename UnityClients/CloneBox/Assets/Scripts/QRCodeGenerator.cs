using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using ZXing;
using ZXing.QrCode;

public static class QRCodeGenerator
{
    public static Texture2D GenerateBarcode(string data, int width, int height){
        var encodeOptions = new QrCodeEncodingOptions{
            Height = height,
            Width = width,
            Margin = 0,
            PureBarcode = false
        };
        encodeOptions.Hints.Add(EncodeHintType.ERROR_CORRECTION, ZXing.QrCode.Internal.ErrorCorrectionLevel.H);

        BarcodeWriter writer = new BarcodeWriter{
            Format = BarcodeFormat.QR_CODE,
            Options = encodeOptions
        };

        Color32[] pixels = writer.Write(data);
        Texture2D tex = new Texture2D(width, height);
        tex.SetPixels32(pixels);
        tex.Apply();
        return tex;
    }
}
