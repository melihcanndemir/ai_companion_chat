import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from '@/app/page';
import '@testing-library/jest-dom';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

const mockUtterance = {
  voice: null,
  pitch: 1,
  rate: 1,
  volume: 1,
  text: '',
  lang: '',
  onstart: null,
  onend: null,
  onerror: null,
  onboundary: null,
};

global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
  ...mockUtterance,
  text,
}));

describe('Home Component', () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn();

    // Mock Speech Synthesis API
    const mockSpeechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
      getVoices: () => [],
      onvoiceschanged: null,
      paused: false,
      pending: false,
      speaking: false
    };

    Object.defineProperty(window, 'speechSynthesis', {
      value: mockSpeechSynthesis,
      writable: true
    });

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve([])
      }), 100))
    );

    render(<Home />);
    
    expect(screen.getByText('Loading...', { exact: false })).toBeInTheDocument();
  });

  it('renders chat interface after loading', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    );

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });
  });

  it('handles message submission', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    );

    await act(async () => {
      render(<Home />);
    });

    const input = screen.getByPlaceholderText('Type your message...');
    const form = screen.getByTestId('chat-form');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.submit(form);
    });

    expect(global.fetch).toHaveBeenCalled();
  });

  it('handles speech synthesis', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: '1', role: 'assistant', content: 'Hello', timestamp: new Date().toISOString() }
        ])
      })
    );

    await act(async () => {
      render(<Home />);
    });

    const speakButton = await screen.findByLabelText('Speak message');
    
    await act(async () => {
      fireEvent.click(speakButton);
    });

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('handles message deletion', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: '1', role: 'user', content: 'Test message', timestamp: new Date().toISOString() }
        ])
      })
    );

    await act(async () => {
      render(<Home />);
    });

    const deleteButton = await screen.findByLabelText('Delete message');

    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1' })
      });
    });
  });
}); 