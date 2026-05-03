const fs = require('fs');

let content = fs.readFileSync('src/components/dashboards/BarberDashboard.tsx', 'utf8');

// 1. Añadir useSearchParams para navegación vía Menu Hamburguesa
if (!content.includes('useSearchParams')) {
  content = content.replace("import { Profile, Service } from '@/types';", "import { Profile, Service } from '@/types';\nimport { useSearchParams } from 'next/navigation';");
}

// 2. Modificar estados iniciales y consultas de agenda
content = content.replace("const [activeTab, setActiveTab] = useState('citas');", `const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'inicio');
  const [selectedAgendaDate, setSelectedAgendaDate] = useState<Date>(new Date());

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);`);

content = content.replace("const { data: agenda } = useBarberAgenda(profile.id);", `const { data: todayAgenda } = useBarberAgenda(profile.id);
  const { data: specificAgenda } = useBarberAgenda(profile.id, selectedAgendaDate.toISOString());
  
  // Para la vista inicio (siempre es hoy)
  const todayPendingAppointments = todayAgenda?.pending || [];
  const todayAppointmentsList = todayAgenda?.today || [];
  
  // Para la vista agenda (depende del calendario)
  const agendaPendingAppointments = specificAgenda?.pending || [];
  const agendaAppointmentsList = specificAgenda?.today || [];`);

content = content.replace("const pendingAppointments = agenda?.pending || [];", "");
content = content.replace("const todayAppointments = agenda?.today || [];", "");

// 3. Reemplazar el viejo Header y las Tabs por el Hero de la vista Inicio
const headerStart = content.indexOf('{/* Header Premium: Identidad Unificada */}');
const tabEnd = content.indexOf("{/* ==== TAB: AGENDA ==== */}");

if (headerStart !== -1 && tabEnd !== -1) {
  content = content.substring(0, headerStart) + `
      {/* Background Photo - Hero Style */}
      {activeTab === 'inicio' && (
        <div className="fixed inset-0 z-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="BG" className="w-full h-full object-cover opacity-20" />
          ) : (
            <img src="/nathon-oski-EW_rqoSdDes-unsplash.jpg" alt="Shop" className="w-full h-full object-cover opacity-10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-[#050505]/40" />
        </div>
      )}

      <div className={\`relative z-10 \${activeTab === 'inicio' ? 'max-w-lg mx-auto pt-10' : ''}\`}>

      {/* ==== VISTA INICIO (RESUMEN DE HOY Y VENTA RÁPIDA) ==== */}
      {activeTab === 'inicio' && (
        <div className="space-y-8 px-4">
          <div className="space-y-1">
            <p className="text-[#f59e0b] text-[10px] font-black uppercase tracking-[0.4em]">Mi Dashboard</p>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-white">¡Hola, {profile.nickname || profile.name.split(' ')[0]}!</h1>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">{profile.email}</p>
          </div>

          <div className="bg-black border border-[#f59e0b]/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b]">Citas de Hoy</span>
                <span className="text-xl font-black italic text-white leading-none">{todayAppointmentsList.length}</span>
              </div>
              
              {todayPendingAppointments.length > 0 && (
                <div className="mt-4 bg-[#f59e0b]/20 text-[#f59e0b] text-xs font-bold p-3 rounded-xl border border-[#f59e0b]/30">
                  Tienes {todayPendingAppointments.length} citas pendientes. ¡Ve a la Agenda!
                </div>
              )}

              <div className="mt-6 space-y-2">
                {todayAppointmentsList.slice(0, 3).map(apt => (
                  <div key={apt.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="font-bold text-white uppercase">{apt.client?.name || apt.client_name}</span>
                    <span className="text-[#f59e0b] font-black">{format(new Date(apt.start_time), 'HH:mm')}</span>
                  </div>
                ))}
                {todayAppointmentsList.length === 0 && (
                  <p className="text-white/40 text-xs italic">No hay citas confirmadas para hoy.</p>
                )}
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:rotate-12 transition-transform duration-700">
              <CalendarIcon size={120} className="text-white" />
            </div>
          </div>

          <button
            onClick={() => { setShowWalkinForm(!showWalkinForm); }}
            className="w-full bg-white text-black py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-3 shadow-2xl hover:bg-[#f59e0b] transition-all active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-12 transition-transform" />
            {showWalkinForm ? "Cerrar Registro" : "Registrar Venta Rápida"}
          </button>
        </div>
      )}
  ` + content.substring(tabEnd);
}

// 4. Transformar 'citas' en 'agenda' y conectar las variables correctas
content = content.replace("{activeTab === 'citas' && (", "{activeTab === 'agenda' && (");
content = content.replace(/pendingAppointments/g, "agendaPendingAppointments");
content = content.replace(/todayAppointments/g, "agendaAppointmentsList");

// 5. Inyectar el DayPicker en la sección de la Agenda
const agendaHoyText = "<h2 className=\"text-2xl font-black uppercase tracking-tight text-black dark:text-white italic\">Hoy: {format(new Date(), 'dd MMMM', {locale: es})}</h2>";
const agendaHoyReplacement = `
            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[3rem] p-6 shadow-xl w-full max-w-sm mx-auto mb-8">
              <DayPicker
                mode="single"
                selected={selectedAgendaDate}
                onSelect={(d) => { if (d) setSelectedAgendaDate(d); }}
                locale={es}
                className="mx-auto"
                showOutsideDays
              />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white italic text-center">Citas: {format(selectedAgendaDate, 'dd MMMM', {locale: es})}</h2>
`;
content = content.replace(agendaHoyText, agendaHoyReplacement);

// 6. Mover el formulario de Walkin (Venta Rápida) para que también funcione en Inicio
const walkinFormStart = content.indexOf("{showWalkinForm && (");
const walkinFormEnd = content.indexOf("{/* ==== TAB: ESTADISTICAS ==== */}");

if (walkinFormStart !== -1 && walkinFormEnd !== -1) {
  const walkinFormJSX = content.substring(walkinFormStart, walkinFormEnd);
  
  // Removerlo de la Agenda antigua
  content = content.substring(0, walkinFormStart) + content.substring(walkinFormEnd);
  
  // Insertarlo en la vista de Inicio, justo después del botón de Venta Rápida
  const btnClose = '{showWalkinForm ? "Cerrar Registro" : "Registrar Venta Rápida"}\\n          </button>';
  const btnIndex = content.indexOf(btnClose);
  
  if (btnIndex !== -1) {
    const injectIndex = btnIndex + btnClose.length;
    content = content.substring(0, injectIndex) + "\\n\\n" + walkinFormJSX + "\\n" + content.substring(injectIndex);
  }
}

// 7. Limpiar el botón viejo de Venta Rápida de la Agenda
const walkinButtonStart = content.indexOf("<button\\n              onClick={() => setShowWalkinForm(!showWalkinForm)}");
if (walkinButtonStart !== -1) {
  const walkinButtonEnd = content.indexOf("</button>", walkinButtonStart) + 9;
  content = content.substring(0, walkinButtonStart) + content.substring(walkinButtonEnd);
}

// 8. Cerrar el div relativo al final del componente
const lastDivIndex = content.lastIndexOf("</div>");
content = content.substring(0, lastDivIndex) + "\\n      </div>\\n" + content.substring(lastDivIndex);

fs.writeFileSync('src/components/dashboards/BarberDashboard.tsx', content);
console.log('BarberDashboard refactored successfully.');
