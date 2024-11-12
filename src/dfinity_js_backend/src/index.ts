import { 
  query, 
  update, 
  text, 
  Record, 
  StableBTreeMap, 
  Variant, 
  Vec, 
  Ok, 
  Err, 
  ic, 
  Result, 
  nat64, 
  Canister, 
  Null, 
} from "azle";
import { v4 as uuidv4 } from "uuid";

// Define Enums
const UserRole = Variant({
  PetOwner: Null,
  Veterinarian: Null,
  Admin: Null,
});

// Record Types
const User = Record({
  id: text,
  username: text,
  email: text,
  phoneNumber: text,
  role: UserRole,
  createdAt: text,
});

const Pet = Record({
  id: text,
  ownerId: text,
  name: text,
  species: text,
  breed: text,
  age: nat64,
  createdAt: text,
});

const Appointment = Record({
  id: text,
  petId: text,
  veterinarianId: text,
  date: text,
  status: text,
  createdAt: text,
});

const HealthRecord = Record({
  id: text,
  petId: text,
  veterinarianId: text,
  record: text,
  createdAt: text,
});

const Prescription = Record({
  id: text,
  petId: text,
  veterinarianId: text,
  medication: text,
  dosage: text,
  createdAt: text,
});

const Message = Record({
  id: text,
  senderId: text,
  recipientId: text,
  content: text,
  createdAt: text,
});

const Notification = Record({
  id: text,
  userId: text,
  message: text,
  createdAt: text,
});

const Payment = Record({
  id: text,
  userId: text,
  appointmentId: text,
  amount: nat64,
  status: text,
  createdAt: text,
});

const PetAdoption = Record({
  id: text,
  petId: text,
  adopterId: text,
  status: text,
  createdAt: text,
});

// Payload Types
const UserPayload = Record({
  username: text,
  email: text,
  phoneNumber: text,
  role: UserRole,
});

const PetPayload = Record({
  ownerId: text,
  name: text,
  species: text,
  breed: text,
  age: nat64,
});

const AppointmentPayload = Record({
  petId: text,
  veterinarianId: text,
  date: text,
});

const HealthRecordPayload = Record({
  petId: text,
  veterinarianId: text,
  record: text,
});

const PrescriptionPayload = Record({
  petId: text,
  veterinarianId: text,
  medication: text,
  dosage: text,
});

const MessagePayload = Record({
  senderId: text,
  recipientId: text,
  content: text,
});

const PaymentPayload = Record({
  userId: text,
  appointmentId: text,
  amount: nat64,
});

const PetAdoptionPayload = Record({
  petId: text,
  adopterId: text,
});

// Error Type
const Error = Variant({
  NotFound: text,
  InvalidPayload: text,
  Unauthorized: text,
});

// Storage
const usersStorage = StableBTreeMap(0, text, User);
const petsStorage = StableBTreeMap(1, text, Pet);
const appointmentsStorage = StableBTreeMap(2, text, Appointment);
const healthRecordsStorage = StableBTreeMap(3, text, HealthRecord);
const prescriptionsStorage = StableBTreeMap(4, text, Prescription);
const messagesStorage = StableBTreeMap(5, text, Message);
const notificationsStorage = StableBTreeMap(6, text, Notification);
const paymentsStorage = StableBTreeMap(7, text, Payment);
const petAdoptionsStorage = StableBTreeMap(8, text, PetAdoption);

export default Canister({
  // User Management
  createUser: update([UserPayload], Result(User, Error), (payload) => {
    if (!payload.username || !payload.email || !payload.phoneNumber || !payload.role) {
      return Err({ InvalidPayload: "All fields are required" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      return Err({ InvalidPayload: "Invalid email format" });
    }
    const existingUser = usersStorage.values().find((user) => user.email === payload.email);
    if (existingUser) {
      return Err({ InvalidPayload: "User with email already exists" });
    }
    const existingUsername = usersStorage.values().find((user) => user.username === payload.username);
    if (existingUsername) {
      return Err({ InvalidPayload: "User with username already exists" });
    }
    const phoneRegex = /^\+?[0-9]{10,14}$/;
    if (!phoneRegex.test(payload.phoneNumber)) {
      return Err({ InvalidPayload: "Invalid phone number format" });
    }
    const id = uuidv4();
    const user = {
      id,
      username: payload.username,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      role: payload.role,
      createdAt: new Date().toISOString(),
    };
    usersStorage.insert(id, user);
    return Ok(user);
  }),

  getUsers: query([], Result(Vec(User), Error), () => {
    const users = usersStorage.values();
    if (users.length === 0) {
      return Err({ NotFound: "No users found" });
    }
    return Ok(users);
  }),

  // Pet Management
  addPet: update([PetPayload], Result(Pet, Error), (payload) => {
    if (!payload.name || !payload.species || !payload.breed) {
      return Err({ InvalidPayload: "All fields are required" });
    }
    const id = uuidv4();
    const pet = {
      id,
      ownerId: payload.ownerId,
      name: payload.name,
      species: payload.species,
      breed: payload.breed,
      age: payload.age,
      createdAt: new Date().toISOString(),
    };
    petsStorage.insert(id, pet);
    return Ok(pet);
  }),

  getPets: query([], Result(Vec(Pet), Error), () => {
    const pets = petsStorage.values();
    if (pets.length === 0) {
      return Err({ NotFound: "No pets found" });
    }
    return Ok(pets);
  }),

  // Appointment Management
  scheduleAppointment: update([AppointmentPayload], Result(Appointment, Error), (payload) => {
    if (!payload.petId || !payload.veterinarianId || !payload.date) {
      return Err({ InvalidPayload: "All fields are required" });
    }
    const pet = petsStorage.get(payload.petId);
    if (!pet) {
      return Err({ NotFound: "Pet not found" });
    }
    const veterinarian = usersStorage.get(payload.veterinarianId);
    if (!veterinarian) {
      return Err({ NotFound: "Veterinarian not found" });
    }
    const id = uuidv4();
    const appointment = {
      id,
      petId: payload.petId,
      veterinarianId: payload.veterinarianId,
      date: payload.date,
      status: "scheduled",
      createdAt: new Date().toISOString(),
    };
    appointmentsStorage.insert(id, appointment);
    return Ok(appointment);
  }),

  getAppointments: query([], Result(Vec(Appointment), Error), () => {
    const appointments = appointmentsStorage.values();
    if (appointments.length === 0) {
      return Err({ NotFound: "No appointments found" });
    }
    return Ok(appointments);
  }),

  // Health Records Management
  addHealthRecord: update([HealthRecordPayload], Result(HealthRecord, Error), (payload) => {
    if (!payload.record) {
      return Err({ InvalidPayload: "Record is required" });
    }
    const pet = petsStorage.get(payload.petId);
    if (!pet) {
      return Err({ NotFound: `Pet with id ${payload.petId} not found` });
    }
    const veterinarian = usersStorage.get(payload.veterinarianId);
    if (!veterinarian) {
      return Err({ NotFound: `Veterinarian with id ${payload.veterinarianId} not found` });
    }
    const id = uuidv4();
    const healthRecord = {
      id,
      petId: payload.petId,
      veterinarianId: payload.veterinarianId,
      record: payload.record,
      createdAt: new Date().toISOString(),
    };
    healthRecordsStorage.insert(id, healthRecord);
    return Ok(healthRecord);
  }),

  getHealthRecords: query([], Result(Vec(HealthRecord), Error), () => {
    const healthRecords = healthRecordsStorage.values();
    if (healthRecords.length === 0) {
      return Err({ NotFound: "No health records found" });
    }
    return Ok(healthRecords);
  }),

  // Prescription Management
  addPrescription: update([PrescriptionPayload], Result(Prescription, Error), (payload) => {
    if (!payload.medication || !payload.dosage) {
      return Err({ InvalidPayload: "Medication and dosage are required" });
    }
    const pet = petsStorage.get(payload.petId);
    if (!pet) {
      return Err({ NotFound: "Pet not found" });
    }
    const veterinarian = usersStorage.get(payload.veterinarianId);
    if (!veterinarian) {
      return Err({ NotFound: "Veterinarian not found" });
    }
    const id = uuidv4();
    const prescription = {
      id,
      petId: payload.petId,
      veterinarianId: payload.veterinarianId,
      medication: payload.medication,
      dosage: payload.dosage,
      createdAt: new Date().toISOString(),
    };
    prescriptionsStorage.insert(id, prescription);
    return Ok(prescription);
  }),

  getPrescriptions: query([], Result(Vec(Prescription), Error), () => {
    const prescriptions = prescriptionsStorage.values();
    if (prescriptions.length === 0) {
      return Err({ NotFound: "No prescriptions found" });
    }
    return Ok(prescriptions);
  }),

  // Message Management
  sendMessage: update([MessagePayload], Result(Message, Error), (payload) => {
    if (!payload.content) {
      return Err({ InvalidPayload: "Content is required" });
    }
    const sender = usersStorage.get(payload.senderId);
    const recipient = usersStorage.get(payload.recipientId);
    if (!sender || !recipient) {
      return Err({ NotFound: "Sender or recipient not found" });
    }
    const id = uuidv4();
    const message = {
      id,
      senderId: payload.senderId,
      recipientId: payload.recipientId,
      content: payload.content,
      createdAt: new Date().toISOString(),
    };
    messagesStorage.insert(id, message);
    return Ok(message);
  }),

  getMessages: query([], Result(Vec(Message), Error), () => {
    const messages = messagesStorage.values();
    if (messages.length === 0) {
      return Err({ NotFound: "No messages found" });
    }
    return Ok(messages);
  }),

  // Notification Management
  sendNotification: update([text, text], Result(Notification, Error), (userId, message) => {
    const user = usersStorage.get(userId);
    if (!user) {
      return Err({ NotFound: "User not found" });
    }
    const id = uuidv4();
    const notification = {
      id,
      userId,
      message,
      createdAt: new Date().toISOString(),
    };
    notificationsStorage.insert(id, notification);
    return Ok(notification);
  }),

  getNotifications: query([], Result(Vec(Notification), Error), () => {
    const notifications = notificationsStorage.values();
    if (notifications.length === 0) {
      return Err({ NotFound: "No notifications found" });
    }
    return Ok(notifications);
  }),

  // Payment Management
  makePayment: update([PaymentPayload], Result(Payment, Error), (payload) => {
    const user = usersStorage.get(payload.userId);
    const appointment = appointmentsStorage.get(payload.appointmentId);
    if (!user || !appointment) {
      return Err({ NotFound: "User or appointment not found" });
    }
    const id = uuidv4();
    const payment = {
      id,
      userId: payload.userId,
      appointmentId: payload.appointmentId,
      amount: payload.amount,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    paymentsStorage.insert(id, payment);
    return Ok(payment);
  }),

  getPayments: query([], Result(Vec(Payment), Error), () => {
    const payments = paymentsStorage.values();
    if (payments.length === 0) {
      return Err({ NotFound: "No payments found" });
    }
    return Ok(payments);
  }),

  // Pet Adoption Management
  adoptPet: update([PetAdoptionPayload], Result(PetAdoption, Error), (payload) => {
    const pet = petsStorage.get(payload.petId);
    if (!pet) {
      return Err({ NotFound: "Pet not found" });
    }
    const adopter = usersStorage.get(payload.adopterId);
    if (!adopter) {
      return Err({ NotFound: "Adopter not found" });
    }
    const id = uuidv4();
    const adoption = {
      id,
      petId: payload.petId,
      adopterId: payload.adopterId,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    petAdoptionsStorage.insert(id, adoption);
    return Ok(adoption);
  }),

  getPetAdoptions: query([], Result(Vec(PetAdoption), Error), () => {
    const petAdoptions = petAdoptionsStorage.values();
    if (petAdoptions.length === 0) {
      return Err({ NotFound: "No pet adoptions found" });
    }
    return Ok(petAdoptions);
  }),
});
