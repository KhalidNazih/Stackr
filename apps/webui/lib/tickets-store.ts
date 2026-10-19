import { create } from 'zustand'
import { apiConfig } from './config'

export interface Ticket {
  id: string
  title: string
  description: string
  status: string
  reported_by: string
  created_at: string
  resolution_message?: string
}

interface TicketsState {
  tickets: Ticket[]
  loaded: boolean
  fetchTickets: () => Promise<void>
  createTicket: (payload: { title: string; description: string; reported_by: string }) => Promise<void>
  updateTicketStatus: (id: string, status: string, resolution_message?: string) => Promise<void>
}

export const useTickets = create<TicketsState>((set) => ({
  tickets: [],
  loaded: false,
  fetchTickets: async () => {
    try {
      const res = await fetch(`${apiConfig.url}/api/tickets`)
      if (!res.ok) throw new Error('Failed to fetch tickets')
      const data = await res.json()
      set({ tickets: data, loaded: true })
    } catch (e) {
      console.error(e)
    }
  },
  createTicket: async (payload) => {
    try {
      const res = await fetch(`${apiConfig.url}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to create ticket')
      const newTicket = await res.json()
      set((state) => ({ tickets: [newTicket, ...state.tickets] }))
    } catch (e) {
      console.error(e)
    }
  },
  updateTicketStatus: async (id, status, resolution_message) => {
    try {
      const res = await fetch(`${apiConfig.url}/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution_message }),
      })
      if (!res.ok) throw new Error('Failed to update ticket')
      set((state) => ({
        tickets: state.tickets.map(t => t.id === id ? { ...t, status, resolution_message } : t)
      }))
    } catch (e) {
      console.error(e)
    }
  }
}))
