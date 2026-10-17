import React, { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';

export function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  characters = DEFAULT_CHARACTERS,
  revealDirection = 'start',
  animateOn = 'hover',
  className = '',
  encryptedClassName = '',
}) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef(null);
  const elementRef = useRef(null);

  const animate = useCallback(() => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayText(text);
      setIsAnimating(false);
      return;
    }

    const visibleIndexes = [...text]
      .map((character, index) => (/\s/.test(character) ? -1 : index))
      .filter((index) => index >= 0);
    if (revealDirection === 'end') visibleIndexes.reverse();
    if (revealDirection === 'center') {
      visibleIndexes.sort(
        (left, right) =>
          Math.abs(left - (text.length - 1) / 2) -
          Math.abs(right - (text.length - 1) / 2)
      );
    }

    setIsAnimating(true);
    let iteration = 0;
    intervalRef.current = window.setInterval(() => {
      iteration += 1;
      const revealedCount = Math.ceil(
        (iteration / Math.max(maxIterations, 1)) * visibleIndexes.length
      );
      const revealedIndexes = new Set(visibleIndexes.slice(0, revealedCount));
      setDisplayText(
        [...text]
          .map((character, index) => {
            if (/\s/.test(character) || revealedIndexes.has(index)) return character;
            return characters[Math.floor(Math.random() * characters.length)] || character;
          })
          .join('')
      );

      if (iteration >= maxIterations) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        setDisplayText(text);
        setIsAnimating(false);
      }
    }, Math.max(speed, 16));
  }, [characters, maxIterations, revealDirection, speed, text]);

  useEffect(() => {
    if (animateOn === 'mount') animate();
    if (animateOn === 'view' && elementRef.current) {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.disconnect();
        }
      });
      observer.observe(elementRef.current);
      return () => observer.disconnect();
    }
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [animate, animateOn]);

  useEffect(() => {
    if (!isAnimating) setDisplayText(text);
  }, [isAnimating, text]);

  const handlers = {
    ...(animateOn === 'hover' || animateOn === 'both'
      ? { onMouseEnter: animate }
      : {}),
    ...(animateOn === 'both' ? { onClick: animate } : {}),
  };

  return (
    <span {...handlers} ref={elementRef} className={className}>
      <span aria-label={text} className={isAnimating ? encryptedClassName : ''}>
        {displayText}
      </span>
    </span>
  );
}

export default DecryptedText;
