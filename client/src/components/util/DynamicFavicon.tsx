/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-20T22:34:37-04:00
 * PURPOSE: This component generates a dynamic favicon for the application. It creates a unique, colorful 3x3 grid pattern on page load, providing a subtle visual identifier for the browser tab. This is a purely client-side effect and does not involve any server communication.
 * SRP and DRY check: Pass. This component has a single responsibility: to create and manage the dynamic favicon. The logic is self-contained and does not duplicate functionality found elsewhere.
 */

import React, { useEffect, useRef } from 'react';

interface DynamicFaviconProps {
  gridSize?: number;
  canvasSize?: number;
  backgroundColor?: string;
}

/**
 * A React component that generates a dynamic, grid-based favicon on page load.
 * The favicon is created using the HTML5 Canvas API and injected into the document's <head>.
 * This provides a unique visual marker for the application tab without requiring any static image assets.
 */
const DynamicFavicon: React.FC<DynamicFaviconProps> = ({ 
  gridSize = 3,
  canvasSize = 32,
  backgroundColor = '#FFFFFF'
}) => {
  // A ref to keep track of the <link> element we add to the document head.
  // This allows us to clean it up properly when the component is unmounted.
  const faviconRef = useRef<HTMLLinkElement | null>(null);

  /**
   * Generates a random hexadecimal color code.
   * @returns A string representing a color, e.g., '#A4F3C1'.
   */
  const getRandomColor = (): string => {
    // This creates a random number, converts it to a hexadecimal string, and pads it to ensure it's a valid 6-digit color code.
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  };

  /**
   * Creates the favicon image as a data URL using the Canvas API.
   * It draws a grid of randomly colored squares.
   * @returns A string containing the base64-encoded PNG image data.
   */
  const generateFaviconDataUrl = (): string => {
    // Create an in-memory canvas element. It's not visible on the page.
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      // This is a fallback in case the browser doesn't support the Canvas API.
      throw new Error('Could not get canvas context');
    }
    
    const squareSize = Math.floor(canvasSize / gridSize);
    
    // First, draw a solid background color. This ensures the favicon looks good on any browser tab color.
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // Loop through rows and columns to draw the grid.
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Assign a random color to each square in the grid.
        const color = getRandomColor();
        ctx.fillStyle = color;
        ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
      }
    }
    
    // Convert the canvas drawing into a PNG image format, encoded as a data URL.
    return canvas.toDataURL('image/png');
  };

  /**
   * Updates the favicon in the document's <head>.
   * It removes the old favicon and appends a new one.
   */
  const updateFavicon = () => {
    try {
      const dataURL = generateFaviconDataUrl();
      
      // If a favicon from this component already exists, remove it first.
      if (faviconRef.current) {
        document.head.removeChild(faviconRef.current);
      }
      
      // Create a new <link> element to hold our favicon.
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = dataURL;
      
      // Add the new favicon to the <head> of the HTML document.
      document.head.appendChild(link);
      // Store a reference to the new link element so we can remove it later.
      faviconRef.current = link;
    } catch (error) {
      console.error('Error updating favicon:', error);
    }
  };

  // This useEffect hook runs once after the component is first rendered.
  useEffect(() => {
    // Generate and set the favicon as soon as the component is on the page.
    updateFavicon();
    
    // The 'return' function in useEffect is a cleanup function.
    // It runs when the component is removed from the page (e.g., on navigation).
    return () => {
      // If we added a favicon, we should remove it to avoid leaving orphaned elements in the <head>.
      if (faviconRef.current && faviconRef.current.parentNode === document.head) {
        document.head.removeChild(faviconRef.current);
      }
    };
  }, []); // The empty dependency array [] ensures this effect runs only once.

  // This component does not render any visible HTML, it only produces a side effect (the favicon).
  return null;
};

export default DynamicFavicon;
