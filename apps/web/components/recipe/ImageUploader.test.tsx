/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IMAGE_CONSTRAINTS } from '@commontable/types';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ImageUploader } from './ImageUploader';

// Mock the image compression module
vi.mock('@/lib/image/compress', () => ({
  isImageFile: vi.fn((file: File) => file.type.startsWith('image/')),
  createImagePreviewUrl: vi.fn(() => 'blob:test-preview-url'),
  revokeImagePreviewUrl: vi.fn(),
}));

describe('ImageUploader', () => {
  const mockOnFileSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnFileSelect.mockResolvedValue(undefined);
  });

  /**
   * Helper to create a mock file with specific size
   */
  function createMockFile(
    name: string = 'test.jpg',
    type: string = 'image/jpeg',
    size: number = 1024,
  ): File {
    // Create a content array of the desired size
    const content = new Uint8Array(size);
    const blob = new Blob([content], { type });
    const file = new File([blob], name, { type });
    // Override size property
    Object.defineProperty(file, 'size', { value: size, writable: false });
    return file;
  }

  describe('rendering', () => {
    it('should render drop zone with instructions', () => {
      render(<ImageUploader onFileSelect={mockOnFileSelect} currentImageCount={0} />);

      expect(screen.getByText(/drop image here or click to browse/i)).toBeInTheDocument();
      expect(screen.getByText(/jpeg, png, or webp/i)).toBeInTheDocument();
    });

    it('should show image count', () => {
      render(<ImageUploader onFileSelect={mockOnFileSelect} currentImageCount={3} />);

      expect(
        screen.getByText(`3 / ${IMAGE_CONSTRAINTS.MAX_IMAGES_PER_RECIPE} images`),
      ).toBeInTheDocument();
    });

    it('should show limit reached message when at max', () => {
      render(
        <ImageUploader
          onFileSelect={mockOnFileSelect}
          currentImageCount={IMAGE_CONSTRAINTS.MAX_IMAGES_PER_RECIPE}
        />,
      );

      expect(
        screen.getByText(
          `Maximum ${IMAGE_CONSTRAINTS.MAX_IMAGES_PER_RECIPE} images per recipe reached`,
        ),
      ).toBeInTheDocument();
    });

    it('should show loading state when uploading', () => {
      render(<ImageUploader onFileSelect={mockOnFileSelect} currentImageCount={0} uploading />);

      expect(screen.getByText(/uploading image/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<ImageUploader onFileSelect={mockOnFileSelect} currentImageCount={0} disabled />);

      // The file input should be disabled
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeDisabled();
    });
  });

  describe('file selection via click', () => {
    it('should open file picker when clicking drop zone', async () => {
      const user = userEvent.setup();

      render(<ImageUploader onFileSelect={mockOnFileSelect} currentImageCount={0} />);

      const dropZone = screen.getByText(/drop image here/i).closest('div')!;
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Mock click on file input
      const clickSpy = vi.spyOn(fileInput, 'click');

      await user.click(dropZone);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should call onFileSelect when file is selected via picker', async () => {
      render(<ImageUploader onFileSelect={mockOnFileSelect} currentImageCount={0} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('photo.jpg', 'image/jpeg', 1024);

      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
      });
    });
  });

  describe('drag and drop', () => {
    it('should handle drag enter event', () => {
      render(<ImageUploader onFileSelect={mockOnFileSelect} currentImageCount={0} />);

      const dropZone = screen.getByText(/drop image here/i).closest('div')!;

      // Drag enter should not throw
      fireEvent.dragEnter(dropZone, {
        dataTransfer: { files: [] },
      });

      // Drop zone should still be visible
      expect(screen.getByText(/drop image here/i)).toBeInTheDocument();
    });

    it('should handle drag leave event', () => {
      render(<ImageUploader onFileSelect={mockOnFileSelect} currentImageCount={0} />);

      const dropZone = screen.getByText(/drop image here/i).closest('div')!;

      fireEvent.dragEnter(dropZone);
      fireEvent.dragLeave(dropZone);

      // Drop zone should still be visible after drag leave
      expect(screen.getByText(/drop image here/i)).toBeInTheDocument();
    });

    it('should call onFileSelect when file is dropped', async () => {
      render(<ImageUploader onFileSelect={mockOnFileSelect} currentImageCount={0} />);

      const dropZone = screen.getByText(/drop image here/i).closest('div')!;
      const file = createMockFile('photo.jpg', 'image/jpeg', 1024);

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
      });
    });

    it('should not accept drop when disabled', () => {
      render(<ImageUploader onFileSelect={mockOnFileSelect} currentImageCount={0} disabled />);

      const dropZone = screen.getByText(/drop image here/i).closest('div')!;
      const file = createMockFile('photo.jpg', 'image/jpeg', 1024);

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should show error for invalid file type', async () => {
      render(<ImageUploader onFileSelect={mockOnFileSelect} currentImageCount={0} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('document.pdf', 'application/pdf', 1024);

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('should show error for file too large', async () => {
      render(<ImageUploader onFileSelect={mockOnFileSelect} currentImageCount={0} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = createMockFile(
        'large.jpg',
        'image/jpeg',
        IMAGE_CONSTRAINTS.MAX_FILE_SIZE_BYTES + 1,
      );

      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText(/file too large/i)).toBeInTheDocument();
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('should show error when upload fails', async () => {
      mockOnFileSelect.mockRejectedValue(new Error('Network error'));

      render(<ImageUploader onFileSelect={mockOnFileSelect} currentImageCount={0} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('photo.jpg', 'image/jpeg', 1024);

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should allow closing error alert', async () => {
      const user = userEvent.setup();

      render(<ImageUploader onFileSelect={mockOnFileSelect} currentImageCount={0} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('document.pdf', 'application/pdf', 1024);

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      });

      // Close the alert
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(screen.queryByText(/invalid file type/i)).not.toBeInTheDocument();
    });
  });

  describe('file input attributes', () => {
    it('should have correct accept attribute', () => {
      render(<ImageUploader onFileSelect={mockOnFileSelect} currentImageCount={0} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput.accept).toBe(IMAGE_CONSTRAINTS.ALLOWED_MIME_TYPES.join(','));
    });

    it('should be hidden', () => {
      render(<ImageUploader onFileSelect={mockOnFileSelect} currentImageCount={0} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput.style.display).toBe('none');
    });
  });
});
