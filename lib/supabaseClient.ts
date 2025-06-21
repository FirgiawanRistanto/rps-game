import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gtqzbknuwjwaposbobsx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cXpia251d2p3YXBvc2JvYnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzOTg5NzgsImV4cCI6MjA2NTk3NDk3OH0.-o7m8W_tBKXJ9eGcCeFgMmhxBAvfJ4HMmXRA45MXyFE'

export const supabase = createClient(supabaseUrl, supabaseKey)
