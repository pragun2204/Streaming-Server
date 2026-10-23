import { describe, it, expect } from 'vitest';
import { formatTime, formatFileSize, computeFileHash } from '../lib/utils';

describe('Frontend Utils', () => {
  it('formats time correctly', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(3665)).toBe('01:01:05');
  });

  it('formats file sizes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  it('computes file hash as hex string', async () => {
    const blob = new Blob(['sample movie binary content'], { type: 'video/mp4' });
    const file = new File([blob], 'movie.mp4');
    const hash = await computeFileHash(file);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // 32 bytes in hex
  });
});
