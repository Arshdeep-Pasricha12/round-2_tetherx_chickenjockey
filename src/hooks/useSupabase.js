import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../config/supabase'

/**
 * Custom hook for realtime Supabase queries with auto-subscription
 * Listens for INSERT, UPDATE, DELETE changes on a table
 */
export function useSupabaseRealtime(table, options = {}) {
  const { select = '*', filter, orderBy, ascending = true } = options
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initial fetch
  const fetchData = useCallback(async () => {
    setLoading(true)
    let query = supabase.from(table).select(select)

    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    if (orderBy) {
      query = query.order(orderBy, { ascending })
    }

    const { data: result, error: err } = await query
    if (err) {
      setError(err.message)
      console.error(`Supabase fetch error [${table}]:`, err)
    } else {
      setData(result || [])
    }
    setLoading(false)
  }, [table, select, JSON.stringify(filter), orderBy, ascending])

  // Realtime subscription
  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel(`realtime-${table}-${JSON.stringify(filter || {})}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          console.log(`[Realtime] ${table}:`, payload.eventType, payload)

          if (payload.eventType === 'INSERT') {
            setData(prev => orderBy && !ascending
              ? [payload.new, ...prev]
              : [...prev, payload.new]
            )
          } else if (payload.eventType === 'UPDATE') {
            setData(prev => prev.map(item =>
              item.id === payload.new.id ? payload.new : item
            ))
          } else if (payload.eventType === 'DELETE') {
            setData(prev => prev.filter(item => item.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Insert a row into a Supabase table
 */
export async function insertRow(table, row) {
  const { data, error } = await supabase.from(table).insert(row).select().single()
  if (error) {
    console.error(`Insert error [${table}]:`, error)
    throw error
  }
  return data
}

/**
 * Update a row in a Supabase table
 */
export async function updateRow(table, id, updates) {
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
  if (error) {
    console.error(`Update error [${table}]:`, error)
    throw error
  }
  return data
}

/**
 * Delete a row from a Supabase table
 */
export async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) {
    console.error(`Delete error [${table}]:`, error)
    throw error
  }
}

/**
 * Query with custom filter
 */
export async function queryRows(table, filters = {}, options = {}) {
  let query = supabase.from(table).select(options.select || '*')

  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? true })
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}
