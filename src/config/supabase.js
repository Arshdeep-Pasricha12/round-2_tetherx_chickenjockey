import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cshzxltrhpmmupbqnvlw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzaHp4bHRyaHBtbXVwYnFudmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3ODcxNjksImV4cCI6MjA4ODM2MzE2OX0.FwIt7qNliLZUWM6EV4ZV4_Ro2sckkyTHLpZFIVjk9cw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
