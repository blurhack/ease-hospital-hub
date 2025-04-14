
import React, { createContext, useContext, useState } from "react";
import { toast } from "@/components/ui/use-toast";

// Define types for our data
export type Doctor = {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience: number;
  contact: string;
  email: string;
  availability: string;
  appointmentsCount: number;
};

export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  bloodGroup: string;
  contact: string;
  email: string;
  address: string;
  medicalHistory: string;
  lastVisit: string;
  assignedDoctor?: string;
};

export type Room = {
  id: string;
  number: string;
  type: "general" | "private" | "icu" | "operation" | "emergency";
  status: "available" | "occupied" | "maintenance";
  floor: number;
  capacity: number;
  currentPatients: number;
  price: number;
};

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: "scheduled" | "completed" | "cancelled";
  reason: string;
};

export type Bill = {
  id: string;
  patientId: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
};

type DataContextType = {
  doctors: Doctor[];
  patients: Patient[];
  rooms: Room[];
  appointments: Appointment[];
  bills: Bill[];
  executeSqlQuery: (query: string) => { success: boolean; data?: any; error?: string };
  addDoctor: (doctor: Omit<Doctor, "id" | "appointmentsCount">) => void;
  addPatient: (patient: Omit<Patient, "id" | "lastVisit">) => void;
  addRoom: (room: Omit<Room, "id">) => void;
  updateRoomStatus: (id: string, status: Room["status"]) => void;
  getDoctorById: (id: string) => Doctor | undefined;
  getPatientById: (id: string) => Patient | undefined;
  getRoomById: (id: string) => Room | undefined;
};

// Sample data
const SAMPLE_DOCTORS: Doctor[] = [
  {
    id: "d1",
    name: "Dr. John Smith",
    specialization: "Cardiology",
    qualification: "MD, FACC",
    experience: 15,
    contact: "+1 (555) 123-4567",
    email: "john.smith@mediease.com",
    availability: "Mon, Wed, Fri 9AM-5PM",
    appointmentsCount: 32,
  },
  {
    id: "d2",
    name: "Dr. Sarah Johnson",
    specialization: "Pediatrics",
    qualification: "MD, FAAP",
    experience: 10,
    contact: "+1 (555) 987-6543",
    email: "sarah.johnson@mediease.com",
    availability: "Tue, Thu 8AM-4PM, Sat 10AM-2PM",
    appointmentsCount: 45,
  },
  {
    id: "d3",
    name: "Dr. Michael Chen",
    specialization: "Neurology",
    qualification: "MD, PhD",
    experience: 12,
    contact: "+1 (555) 456-7890",
    email: "michael.chen@mediease.com",
    availability: "Mon-Fri 10AM-6PM",
    appointmentsCount: 28,
  },
];

const SAMPLE_PATIENTS: Patient[] = [
  {
    id: "p1",
    name: "Emily Wilson",
    age: 42,
    gender: "female",
    bloodGroup: "O+",
    contact: "+1 (555) 234-5678",
    email: "emily.wilson@example.com",
    address: "123 Main St, Anytown, USA",
    medicalHistory: "Hypertension, Mild asthma",
    lastVisit: "2023-05-15",
    assignedDoctor: "d1",
  },
  {
    id: "p2",
    name: "James Brown",
    age: 8,
    gender: "male",
    bloodGroup: "AB-",
    contact: "+1 (555) 876-5432",
    email: "parent.of.james@example.com",
    address: "456 Oak Dr, Somewhere, USA",
    medicalHistory: "Seasonal allergies",
    lastVisit: "2023-06-02",
    assignedDoctor: "d2",
  },
  {
    id: "p3",
    name: "Maria Garcia",
    age: 65,
    gender: "female",
    bloodGroup: "A+",
    contact: "+1 (555) 345-6789",
    email: "maria.garcia@example.com",
    address: "789 Pine Rd, Elsewhere, USA",
    medicalHistory: "Type 2 diabetes, Arthritis",
    lastVisit: "2023-05-28",
    assignedDoctor: "d3",
  },
];

const SAMPLE_ROOMS: Room[] = [
  {
    id: "r1",
    number: "101",
    type: "general",
    status: "available",
    floor: 1,
    capacity: 4,
    currentPatients: 0,
    price: 200,
  },
  {
    id: "r2",
    number: "201",
    type: "private",
    status: "occupied",
    floor: 2,
    capacity: 1,
    currentPatients: 1,
    price: 500,
  },
  {
    id: "r3",
    number: "301",
    type: "icu",
    status: "available",
    floor: 3,
    capacity: 1,
    currentPatients: 0,
    price: 1200,
  },
  {
    id: "r4",
    number: "401",
    type: "operation",
    status: "maintenance",
    floor: 4,
    capacity: 1,
    currentPatients: 0,
    price: 2000,
  },
];

const SAMPLE_APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    patientId: "p1",
    doctorId: "d1",
    date: "2023-06-15",
    time: "10:30 AM",
    status: "completed",
    reason: "Annual checkup",
  },
  {
    id: "a2",
    patientId: "p2",
    doctorId: "d2",
    date: "2023-06-18",
    time: "2:00 PM",
    status: "scheduled",
    reason: "Flu symptoms",
  },
  {
    id: "a3",
    patientId: "p3",
    doctorId: "d3",
    date: "2023-06-20",
    time: "11:15 AM",
    status: "scheduled",
    reason: "Follow-up visit",
  },
];

const SAMPLE_BILLS: Bill[] = [
  {
    id: "b1",
    patientId: "p1",
    date: "2023-05-15",
    amount: 350,
    status: "paid",
    items: [
      {
        description: "Consultation",
        quantity: 1,
        unitPrice: 200,
        total: 200,
      },
      {
        description: "Blood test",
        quantity: 1,
        unitPrice: 150,
        total: 150,
      },
    ],
  },
  {
    id: "b2",
    patientId: "p2",
    date: "2023-06-02",
    amount: 175,
    status: "pending",
    items: [
      {
        description: "Pediatric consultation",
        quantity: 1,
        unitPrice: 175,
        total: 175,
      },
    ],
  },
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doctors, setDoctors] = useState<Doctor[]>(SAMPLE_DOCTORS);
  const [patients, setPatients] = useState<Patient[]>(SAMPLE_PATIENTS);
  const [rooms, setRooms] = useState<Room[]>(SAMPLE_ROOMS);
  const [appointments, setAppointments] = useState<Appointment[]>(SAMPLE_APPOINTMENTS);
  const [bills, setBills] = useState<Bill[]>(SAMPLE_BILLS);

  // Function to execute SQL-like queries (simplified for demo)
  const executeSqlQuery = (query: string) => {
    try {
      query = query.toLowerCase().trim();
      
      // SELECT queries
      if (query.startsWith("select")) {
        if (query.includes("from doctors")) {
          return { success: true, data: doctors };
        } else if (query.includes("from patients")) {
          return { success: true, data: patients };
        } else if (query.includes("from rooms")) {
          return { success: true, data: rooms };
        } else if (query.includes("from appointments")) {
          return { success: true, data: appointments };
        } else if (query.includes("from bills")) {
          return { success: true, data: bills };
        }
      }
      
      // Simple COUNT queries
      if (query.includes("count") && query.includes("from")) {
        if (query.includes("from doctors")) {
          return { success: true, data: [{ count: doctors.length }] };
        } else if (query.includes("from patients")) {
          return { success: true, data: [{ count: patients.length }] };
        } else if (query.includes("from rooms")) {
          return { success: true, data: [{ count: rooms.length }] };
        }
      }
      
      // Simple filtering
      if (query.includes("where")) {
        if (query.includes("from rooms") && query.includes("status")) {
          const status = query.match(/status\s*=\s*['"](\w+)['"]/)?.[1];
          if (status) {
            const filteredRooms = rooms.filter(room => room.status === status);
            return { success: true, data: filteredRooms };
          }
        }
      }

      return { 
        success: false, 
        error: "Query not supported or invalid syntax. Try simple SELECT, COUNT queries." 
      };
    } catch (error) {
      return { 
        success: false, 
        error: "Error executing query" 
      };
    }
  };

  const addDoctor = (doctor: Omit<Doctor, "id" | "appointmentsCount">) => {
    const newDoctor: Doctor = {
      ...doctor,
      id: `d${doctors.length + 1}`,
      appointmentsCount: 0,
    };
    
    setDoctors([...doctors, newDoctor]);
    toast({
      title: "Doctor added",
      description: `Dr. ${doctor.name} has been added to the system.`,
    });
  };

  const addPatient = (patient: Omit<Patient, "id" | "lastVisit">) => {
    const today = new Date().toISOString().split("T")[0];
    const newPatient: Patient = {
      ...patient,
      id: `p${patients.length + 1}`,
      lastVisit: today,
    };
    
    setPatients([...patients, newPatient]);
    toast({
      title: "Patient added",
      description: `${patient.name} has been added to the system.`,
    });
  };

  const addRoom = (room: Omit<Room, "id">) => {
    const newRoom: Room = {
      ...room,
      id: `r${rooms.length + 1}`,
    };
    
    setRooms([...rooms, newRoom]);
    toast({
      title: "Room added",
      description: `Room ${room.number} has been added to the system.`,
    });
  };

  const updateRoomStatus = (id: string, status: Room["status"]) => {
    setRooms(
      rooms.map((room) =>
        room.id === id ? { ...room, status } : room
      )
    );
    
    const room = rooms.find(r => r.id === id);
    if (room) {
      toast({
        title: "Room status updated",
        description: `Room ${room.number} is now ${status}.`,
      });
    }
  };

  const getDoctorById = (id: string) => {
    return doctors.find((doctor) => doctor.id === id);
  };

  const getPatientById = (id: string) => {
    return patients.find((patient) => patient.id === id);
  };

  const getRoomById = (id: string) => {
    return rooms.find((room) => room.id === id);
  };

  return (
    <DataContext.Provider
      value={{
        doctors,
        patients,
        rooms,
        appointments,
        bills,
        executeSqlQuery,
        addDoctor,
        addPatient,
        addRoom,
        updateRoomStatus,
        getDoctorById,
        getPatientById,
        getRoomById,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
