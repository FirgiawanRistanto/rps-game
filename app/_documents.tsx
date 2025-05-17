// app/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <script
          src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.min.js"
          strategy="beforeInteractive"
        ></script>
        <script
          src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.min.js"
          strategy="beforeInteractive"
        ></script>
        <script
          src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.min.js"
          strategy="beforeInteractive"
        ></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
