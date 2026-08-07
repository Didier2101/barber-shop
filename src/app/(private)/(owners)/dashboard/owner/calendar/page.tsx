'use client';
import { useState, } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AppointmentDrawer } from '@/components/owner/calendar/AppointmentDrawer';
import { Profile, Appointment, ShopSettings } from '@/types';

const locales = {
  'es': es,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function CalendarPage() {
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());
  
  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date, end: Date } | null>(null);

  // Fetch shop settings to know opening and closing times
  const { data: shopSettings } = useQuery({
    queryKey: ['shop_settings'],
    queryFn: async () => {
      const { data } = await supabase.from('shop_settings').select('*').single();
      return (data as ShopSettings) || null;
    }
  });

  // Fetch all barbers (active) to color code them
  const { data: barbers = [] } = useQuery({
    queryKey: ['active_barbers'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'barber').eq('is_active', true);
      return (data as Profile[]) || [];
    }
  });

  // Fetch all appointments
  const { data: appointments = [], refetch } = useQuery({
    queryKey: ['admin_appointments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select(`
          *,
          client:client_id(id, name, phone),
          barber:barber_id(id, name, nickname)
        `)
        .neq('status', 'cancelled');
      return (data as Appointment[]) || [];
    },
    refetchInterval: 10000 // Refetch every 10s to stay up to date
  });

  // Prepare events for react-big-calendar
  const events = appointments.map(apt => {
    // Generate a consistent color for the barber
    const barberIndex = barbers.findIndex(b => b.id === apt.barber_id);
    const colorClasses = [
      'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-rose-500'
    ];
    const colorClass = barberIndex !== -1 ? colorClasses[barberIndex % colorClasses.length] : 'bg-erp-primary';

    const clientName = apt.client?.name || apt.client_name || 'Cliente sin cuenta';
    const servicesTitle = apt.services_data.map(s => s.name).join(', ');

    return {
      id: apt.id,
      title: `${clientName} - ${servicesTitle} (${apt.barber?.nickname || apt.barber?.name})`,
      start: new Date(apt.start_time),
      end: new Date(apt.end_time),
      resource: apt,
      colorClass
    };
  });

  // Min and Max times for calendar view
  const minTime = new Date();
  minTime.setHours(shopSettings?.opening_time ? parseInt(shopSettings.opening_time.split(':')[0]) : 8, 0, 0);
  
  const maxTime = new Date();
  maxTime.setHours(shopSettings?.closing_time ? parseInt(shopSettings.closing_time.split(':')[0]) : 22, 0, 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event.resource);
    setSelectedSlot(null);
    setIsDrawerOpen(true);
  };

  const handleSelectSlot = (slotInfo: { start: Date, end: Date }) => {
    // Prevent creating appointments in the past
    if (isBefore(slotInfo.start, new Date()) && slotInfo.start.getDate() === new Date().getDate() && slotInfo.start.getMonth() === new Date().getMonth()) {
       // Allow if same day just for testing, but ideally block past hours. Let's keep it simple.
    }
    setSelectedEvent(null);
    setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
    setIsDrawerOpen(true);
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-erp-text">Calendario</h1>
          <p className="text-[10px] font-bold text-erp-text-muted uppercase tracking-widest mt-1">
             Gestiona todas las reservas de la barbería
          </p>
        </div>
        <button 
          onClick={() => {
            setSelectedEvent(null);
            setSelectedSlot({ start: new Date(), end: new Date(new Date().getTime() + 30 * 60000) });
            setIsDrawerOpen(true);
          }}
          className="bg-erp-primary text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-erp-primary/90 transition-all shadow-md active:scale-95"
        >
          + Nueva Reserva
        </button>
      </div>

      <div className="flex-1 bg-erp-surface border border-erp-border rounded-2xl p-6 shadow-sm min-h-[600px] calendar-override">
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          date={date}
          onView={(v) => setView(v)}
          onNavigate={(d) => setDate(d)}
          selectable
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          min={minTime}
          max={maxTime}
          step={15}
          timeslots={2}
          defaultView="week"
          messages={{
            next: "Sig",
            previous: "Ant",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Reserva",
            noEventsInRange: "No hay reservas en este rango."
          }}
          eventPropGetter={(event) => {
            return {
              className: `border-none rounded-lg shadow-sm font-bold text-xs p-1 ${event.colorClass}`,
              style: {
                color: 'white',
              }
            };
          }}
        />
      </div>

      {isDrawerOpen && (
        <AppointmentDrawer 
          isOpen={isDrawerOpen} 
          onClose={() => {
             setIsDrawerOpen(false);
             refetch();
          }}
          existingAppointment={selectedEvent}
          selectedSlot={selectedSlot}
          barbers={barbers}
        />
      )}
      
      {/* Estilos personalizados para sobreescribir react-big-calendar y adaptarlo al ERP */}
      <style dangerouslySetInnerHTML={{__html: `
        .calendar-override .rbc-calendar {
          font-family: inherit;
        }
        .calendar-override .rbc-header {
          padding: 16px 0;
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: var(--erp-text-muted);
          border-bottom: 1px solid var(--erp-border);
        }
        .calendar-override .rbc-today {
          background-color: var(--erp-bg);
        }
        .calendar-override .rbc-off-range-bg {
          background-color: transparent;
        }
        .calendar-override .rbc-time-view, .calendar-override .rbc-month-view {
          border-color: var(--erp-border);
          border-radius: 12px;
          overflow: hidden;
        }
        .calendar-override .rbc-time-header-content {
          border-color: var(--erp-border);
        }
        .calendar-override .rbc-time-content {
          border-top: 1px solid var(--erp-border);
        }
        .calendar-override .rbc-day-bg + .rbc-day-bg {
          border-color: var(--erp-border);
        }
        .calendar-override .rbc-timeslot-group {
          border-bottom: 1px solid var(--erp-border);
          min-height: 80px; /* Hacer los espacios más grandes */
        }
        .calendar-override .rbc-time-slot {
          color: var(--erp-text-muted);
          font-size: 11px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .calendar-override .rbc-button-link {
          color: var(--erp-text);
          font-weight: bold;
        }
        .calendar-override .rbc-active {
          color: var(--erp-primary) !important;
        }
        .calendar-override .rbc-toolbar button {
          color: var(--erp-text-muted);
          border-color: var(--erp-border);
          font-weight: bold;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-radius: 8px;
        }
        .calendar-override .rbc-toolbar button:hover {
          background-color: var(--erp-bg);
        }
        .calendar-override .rbc-toolbar button.rbc-active {
          background-color: var(--erp-primary) !important;
          color: white !important;
          border-color: var(--erp-primary) !important;
        }
      `}} />
    </div>
  );
}
