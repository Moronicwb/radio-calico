import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../server.js'

describe('GET /api/ratings', () => {
  it('returns zero counts for an unknown track', async () => {
    const res = await request(app).get('/api/ratings?trackId=unknown')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ up: 0, down: 0, userRating: null })
  })

  it('returns 400 when trackId is missing', async () => {
    const res = await request(app).get('/api/ratings')
    expect(res.status).toBe(400)
  })

  it('reflects a recorded vote', async () => {
    await request(app).post('/api/rate').send({ trackId: 'track-1', rating: 'down' })
    const res = await request(app).get('/api/ratings?trackId=track-1')
    expect(res.body.down).toBe(1)
    expect(res.body.up).toBe(0)
    expect(res.body.userRating).toBe('down')
  })
})

describe('POST /api/rate', () => {
  it('records an up vote', async () => {
    const res = await request(app)
      .post('/api/rate')
      .send({ trackId: 'track-1', rating: 'up' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ up: 1, down: 0, userRating: 'up' })
  })

  it('upserts — changing from up to down updates counts', async () => {
    await request(app).post('/api/rate').send({ trackId: 'track-1', rating: 'up' })
    const res = await request(app).post('/api/rate').send({ trackId: 'track-1', rating: 'down' })
    expect(res.body).toEqual({ up: 0, down: 1, userRating: 'down' })
  })

  it('returns 400 for an invalid rating value', async () => {
    const res = await request(app)
      .post('/api/rate')
      .send({ trackId: 'track-1', rating: 'meh' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when trackId is missing', async () => {
    const res = await request(app)
      .post('/api/rate')
      .send({ rating: 'up' })
    expect(res.status).toBe(400)
  })
})
