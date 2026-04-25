/**
 * Injects custom scrollbar styling that matches the website theme
 * Uses purple (#7C5CFF) primary color with dark background
 */
export const injectScrollbarStyles = () => {
  if (typeof document === "undefined") return;

  const style = document.createElement("style");
  style.textContent = `
    /* Webkit browsers (Chrome, Safari, Edge) */
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    ::-webkit-scrollbar-thumb {
      background: #7C5CFF;
      border-radius: 5px;
      transition: background 0.3s ease;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #9575FF;
    }

    ::-webkit-scrollbar-thumb:active {
      background: #6B4EE6;
    }

    /* Firefox */
    * {
      scrollbar-color: #7C5CFF transparent;
      scrollbar-width: thin;
    }
  `;

  document.head.appendChild(style);
};
