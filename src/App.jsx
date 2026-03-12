import React, { useState, useMemo, useEffect } from 'react';
import { 
  MapPin, Users, Clock, BookOpen, Filter, History, Home, BarChart3, Target, Upload, 
  CheckCircle2, Cloud, CloudOff, CloudLightning, Loader2, Camera, ExternalLink, 
  Image as ImageIcon, BookMarked, ChevronDown, ChevronUp, BookText, Award, Wind, Search, AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';

// =========================================================================
// --- FIREBASE & ROWY INITIALIZATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCgRN8WXDabr6OVNXO8AliOOXfiO9uTEP8",
  authDomain: "sand-river-hunting-history-65.firebaseapp.com",
  projectId: "sand-river-hunting-history-65",
  storageBucket: "sand-river-hunting-history-65.appspot.com",
  messagingSenderId: "506475795580",
  appId: "1:506475795580:web:991142b947315fbdae25f9",
  measurementId: "G-WQSL0B3TDE"
};

// *** EXACT ROWY TABLE NAME ***
const ROWY_TABLE_NAME = "TESTTABLE1"; 
// =========================================================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Default Curated Highlights (Fallback data)
const defaultStats = [
  { year: 1961, hunter: "John Godava", sex: "Buck", location: "Pollock's Lowland", time: "AM", party: 3, weather: "Clear/Cold", note: "The First One. Purchased South 40 for $40 + timber value.", story: "The foundation of Sand River was laid by a cast of characters as colorful as the Minnesota woods themselves. In the spring of 1961, they purchased the 'South 40 Acres' for $40 plus $175 for timber value.", partyPhoto: "https://images.unsplash.com/photo-1520699697851-3d29cb1f17bd?q=80&w=800&auto=format&fit=crop", harvestPhoto: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop" }
];

const COLORS = ['#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5'];

const App = () => {
  const [statsData, setStatsData] = useState(defaultStats);
  const [isDataImported, setIsDataImported] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('connecting'); 
  const [dbErrorMessage, setDbErrorMessage] = useState('');
  const [rawSample, setRawSample] = useState(null); // The Detective
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('archive');
  const [filterSex, setFilterSex] = useState('All');
  const [filterDecade, setFilterDecade] = useState('All');
  const [activeYearbookYear, setActiveYearbookYear] = useState(null);

  useEffect(() => {
    if (!db) return;
    
    const colRef = collection(db, ROWY_TABLE_NAME);
    
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const records = [];
      let sampleCaptured = null;

      snapshot.forEach((doc) => {
        const raw = doc.data();
        
        // Grab the very first row we see for the Detective Banner
        if (!sampleCaptured) {
          sampleCaptured = raw;
        }
        
        // --- THE SMART SANITIZER ---
        const rawYear = raw.year || raw.Year || raw.YEAR;
        const rawHunter = raw.hunter || raw.Hunter || raw.Name || raw.HUNTER;
        const rawSex = raw.sex || raw.Sex || raw.Type || raw.SEX;
        const rawLocation = raw.location || raw.Location || raw.Stand || raw.LOCATION;
        const rawWeather = raw.weather || raw.Weather || raw.WEATHER;
        const rawParty = raw.party || raw.Party || raw.Size || raw.PARTY;
        const rawNote = raw.note || raw.Note || raw.Notes || raw.NOTE;
        const rawStory = raw.story || raw.Story || raw.STORY;
        
        records.push({
          id: doc.id,
          year: Number(rawYear) || 0,
          hunter: rawHunter ? String(rawHunter) : "Unknown",
          sex: rawSex ? String(rawSex) : "Unk",
          location: rawLocation ? String(rawLocation) : "Unknown",
          weather: rawWeather ? String(rawWeather) : "",
          party: Number(rawParty) || 0,
          note: rawNote ? String(rawNote) : "",
          story: rawStory ? String(rawStory) : null,
          partyPhoto: raw.partyPhoto || raw.PartyPhoto || null,
          harvestPhoto: raw.harvestPhoto || raw.HarvestPhoto || null,
          yearlyAlbum: raw.yearlyAlbum || raw.YearlyAlbum || null
        });
      });

      if (records.length > 0) {
        const sortedData = records.sort((a, b) => a.year - b.year);
        setStatsData(sortedData);
        setIsDataImported(true);
        setRawSample(sampleCaptured);
        setCloudStatus('synced');
      } else {
        setCloudStatus('empty');
      }
    }, (error) => {
      console.error("Firestore error:", error);
      setCloudStatus('error');
      setDbErrorMessage(error.message);
    });

    return () => unsubscribe();
  }, []);

  const decades = useMemo(() => {
    const decs = new Set(statsData.map(item => Math.floor(item.year / 10) * 10).filter(y => y > 0));
    return Array.from(decs).sort();
  }, [statsData]);

  const filteredData = useMemo(() => {
    return statsData.filter(item => {
      const matchesSearch = Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesSex = filterSex === 'All' || item.sex === filterSex;
      const itemDecade = Math.floor(item.year / 10) * 10;
      const matchesDecade = filterDecade === 'All' || itemDecade === parseInt(filterDecade);
      return matchesSearch && matchesSex && matchesDecade;
    });
  }, [statsData, searchTerm, filterSex, filterDecade]);

  const hunterStats = useMemo(() => {
    const stats = {};
    statsData.forEach(d => {
      if (d.hunter === "No Harvest" || d.hunter === "Unknown" || d.hunter === "Multiple" || d.hunter.includes("Unknown")) return;
      if (!stats[d.hunter]) stats[d.hunter] = 0;
      stats[d.hunter]++;
    });
    return Object.entries(stats).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [statsData]);

  const timelineData = useMemo(() => {
    const intervals = {};
    statsData.forEach(d => {
      if (!d.year) return;
      const interval = Math.floor(d.year / 5) * 5;
      if (!intervals[interval]) intervals[interval] = { year: `${interval}s`, harvests: 0, hunters: d.party || 5 };
      if (d.hunter !== "No Harvest") intervals[interval].harvests += 1;
    });
    return Object.values(intervals).sort((a, b) => a.year.localeCompare(b.year));
  }, [statsData]);

  const sexStats = useMemo(() => {
    const stats = { Buck: 0, Doe: 0 };
    statsData.forEach(d => {
      if (d.sex === "Buck") stats.Buck++;
      if (d.sex.includes("Doe") || d.sex.includes("Fawn")) stats.Doe++;
    });
    return [{ name: 'Bucks', value: stats.Buck }, { name: 'Does', value: stats.Doe }];
  }, [statsData]);

  const groupedTimelineEvents = useMemo(() => {
    const eventsMap = new Map();
    statsData.forEach(item => {
      if (!item.year) return;
      
      if (!eventsMap.has(item.year)) {
        eventsMap.set(item.year, {
          year: item.year,
          weather: item.weather,
          party: item.party,
          note: item.note,
          story: item.story,               
          partyPhoto: item.partyPhoto,     
          harvestPhoto: item.harvestPhoto, 
          yearlyAlbum: item.yearlyAlbum, 
          locations: new Set(),
          harvests: []
        });
      }
      
      const event = eventsMap.get(item.year);
      
      if (!event.story && item.story) event.story = item.story;
      if (!event.yearlyAlbum && item.yearlyAlbum) event.yearlyAlbum = item.yearlyAlbum;
      
      if (!event.partyPhoto && item.partyPhoto) event.partyPhoto = Array.isArray(item.partyPhoto) ? item.partyPhoto[0]?.downloadURL : item.partyPhoto;
      if (!event.harvestPhoto && item.harvestPhoto) event.harvestPhoto = Array.isArray(item.harvestPhoto) ? item.harvestPhoto[0]?.downloadURL : item.harvestPhoto;

      if (item.location && item.location !== 'N/A' && item.location !== 'Varies') event.locations.add(item.location);
      if (item.hunter !== "No Harvest") {
        event.harvests.push({
          hunter: item.hunter,
          sex: item.sex,
          location: item.location
        });
      }
    });
    return Array.from(eventsMap.values()).sort((a,b) => b.year - a.year);
  }, [statsData]);

  const totalHarvests = statsData.filter(d => d.hunter !== "No Harvest").length;
  const skunkedYears = groupedTimelineEvents.filter(e => e.harvests.length === 0).length;

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-stone-900 font-sans">
      <nav className="bg-[#1e312a] text-[#e8f0ed] p-5 sticky top-0 z-50 shadow-xl border-b border-emerald-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-800 rounded-lg flex items-center justify-center shadow-lg border border-emerald-700">
              <History className="text-emerald-50" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl font-black tracking-tight leading-none uppercase">Sand River Hilton</h1>
              </div>
              <p className="text-[10px] tracking-[0.2em] font-bold text-emerald-500 mt-1 uppercase">65-Year Master Chronology</p>
            </div>
          </div>
          <div className="flex bg-[#14231d] p-1 rounded-full border border-emerald-900/50 overflow-x-auto w-full md:w-auto">
            <TabButton active={activeTab === 'archive'} onClick={() => setActiveTab('archive')} label="The Ledger" icon={<BookOpen size={14}/>} />
            <TabButton active={activeTab === 'yearbook'} onClick={() => setActiveTab('yearbook')} label="The Book" icon={<BookMarked size={14}/>} />
          </div>
        </div>
      </nav>

      {/* --- DIAGNOSTIC BANNERS --- */}
      {cloudStatus === 'error' && (
        <div className="bg-red-600 text-white p-4 text-center font-bold text-sm shadow-inner flex items-center justify-center gap-2">
          <AlertTriangle size={18} /> FIREBASE BLOCKED CONNECTION: {dbErrorMessage}
        </div>
      )}
      
      {cloudStatus === 'empty' && (
        <div className="bg-amber-500 text-amber-950 p-4 text-center font-bold text-sm shadow-inner flex items-center justify-center gap-2">
          <AlertTriangle size={18} /> TABLE '{ROWY_TABLE_NAME}' IS EMPTY OR DOESN'T EXIST.
        </div>
      )}

      {cloudStatus === 'synced' && rawSample && (
        <div className="bg-blue-600 text-white p-6 shadow-inner flex flex-col items-center justify-center gap-4 w-full">
          <div className="flex items-center gap-2 font-black text-lg">
            <CheckCircle2 size={24} /> SUCCESSFULLY IMPORTED {statsData.length} RECORDS!
          </div>
          <div className="w-full max-w-4xl bg-blue-950 p-6 rounded-xl text-left font-mono text-sm overflow-x-auto border border-blue-400">
            <p className="text-blue-300 font-bold mb-4 uppercase tracking-widest text-xs">🔍 Database Detective: Here are your hidden "Field Keys" from Rowy:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              {Object.entries(rawSample).map(([key, val]) => (
                <div key={key} className="border-b border-blue-800 pb-1">
                  <span className="text-yellow-400 font-bold">"{key}"</span> : 
                  <span className="text-blue-100 ml-2">{val !== null && typeof val === 'object' ? JSON.stringify(val).substring(0, 50) + "..." : String(val)}</span>
                </div>
              ))}
            </div>
            <p className="text-blue-200 mt-4 text-xs italic">
              *If you see your Hunter's name sitting next to a key like "column2", that means "column2" is the real Field Key!
            </p>
          </div>
        </div>
      )}
      {/* ------------------------- */}

      <main className="max-w-7xl mx-auto p-4 md:p-10">
        {activeTab === 'archive' && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-full mt-8">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-[11px] uppercase tracking-widest text-stone-400 font-bold border-b">
                  <tr>
                    <th className="px-6 py-4">Year</th>
                    <th className="px-6 py-4">Hunter</th>
                    <th className="px-6 py-4">Stand</th>
                    <th className="px-6 py-4">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredData.slice(0, 50).map((item, i) => (
                    <tr key={i} className="hover:bg-emerald-50/50 transition-colors group">
                      <td className="px-6 py-4"><span className="font-serif font-black text-lg text-emerald-950">{item.year}</span></td>
                      <td className="px-6 py-4 font-bold text-stone-800">{item.hunter}</td>
                      <td className="px-6 py-4 text-sm text-stone-600">{item.location}</td>
                      <td className="px-6 py-4 text-[10px] font-black uppercase">{item.sex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${active ? 'bg-emerald-800 text-white shadow-lg' : 'text-emerald-500 hover:text-emerald-100'}`}>
    {icon} {label}
  </button>
);

const HeroStat = ({ label, value, sub, color }) => (
  <div className={`p-6 rounded-3xl border-2 shadow-sm bg-white`}>
    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">{label}</p>
    <p className="text-3xl font-serif font-black">{value}</p>
  </div>
);

export default App;
