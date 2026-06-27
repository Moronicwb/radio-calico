import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { applyRatingState, currentTrackIdStr, rate } from '../../public/app.js'

beforeEach(() => {
  document.body.innerHTML = `
    <div id="artist">The Cure</div>
    <div id="title">Lovesong</div>
    <button id="rate-up">👍 <span id="count-up">0</span></button>
    <button id="rate-down">👎 <span id="count-down">0</span></button>
  `
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('currentTrackIdStr', () => {
  it('builds the track ID from artist and title DOM elements', () => {
    expect(currentTrackIdStr()).toBe('The Cure|||Lovesong')
  })
})

describe('applyRatingState', () => {
  it('updates vote counts', () => {
    applyRatingState({ up: 5, down: 2, userRating: null })
    expect(document.getElementById('count-up')!.textContent).toBe('5')
    expect(document.getElementById('count-down')!.textContent).toBe('2')
  })

  it('marks the voted button active', () => {
    applyRatingState({ up: 1, down: 0, userRating: 'up' })
    expect(document.getElementById('rate-up')!.classList.contains('active')).toBe(true)
    expect(document.getElementById('rate-down')!.classList.contains('active')).toBe(false)
  })

  it('dims the unchosen button when a vote exists', () => {
    applyRatingState({ up: 0, down: 1, userRating: 'down' })
    expect((document.getElementById('rate-up') as HTMLElement).style.opacity).toBe('0.45')
    expect((document.getElementById('rate-down') as HTMLElement).style.opacity).toBe('1')
  })

  it('restores full opacity when no vote is cast', () => {
    applyRatingState({ up: 0, down: 0, userRating: null })
    expect((document.getElementById('rate-up') as HTMLElement).style.opacity).toBe('1')
    expect((document.getElementById('rate-down') as HTMLElement).style.opacity).toBe('1')
  })
})

describe('rate', () => {
  it('POSTs to /api/rate with the current track ID and applies the returned state', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ up: 1, down: 0, userRating: 'up' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await rate('up')

    expect(mockFetch).toHaveBeenCalledWith('/api/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId: 'The Cure|||Lovesong', rating: 'up' }),
    })
    expect(document.getElementById('count-up')!.textContent).toBe('1')
  })

  it('does not update DOM when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid request' }),
    }))

    await rate('up')

    expect(document.getElementById('count-up')!.textContent).toBe('0')
  })
})
