import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

export default function SplitText({
  text = '',
  className = '',
  delay = 50,
  duration = 0.6,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 20 },
  to = { opacity: 1, y: 0 },
  onLetterAnimationComplete,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const targetClass = splitType === 'words' ? '.split-word' : '.split-char';
    const targets = el.querySelectorAll(targetClass);

    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { ...from },
        {
          ...to,
          duration: duration,
          stagger: delay / 1000,
          ease: ease,
          onComplete: () => {
            if (onLetterAnimationComplete) onLetterAnimationComplete();
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [text, delay, duration, ease, splitType, from, to]);

  const renderElements = () => {
    if (splitType === 'words') {
      return text.split(' ').map((word, i) => (
        <span
          key={i}
          style={{ display: 'inline-block', overflow: 'hidden', marginRight: '0.25em' }}
        >
          <span className="split-word" style={{ display: 'inline-block' }}>
            {word}
          </span>
        </span>
      ));
    }

    return text.split('').map((char, i) => (
      <span
        key={i}
        style={{ display: 'inline-block', overflow: 'hidden' }}
      >
        <span className="split-char" style={{ display: 'inline-block' }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      </span>
    ));
  };

  return (
    <span
      ref={containerRef}
      className={className}
      style={{ display: 'inline-block', overflow: 'hidden' }}
    >
      {renderElements()}
    </span>
  );
}

