/**
 * Author: Codex
 * Date: 2026-10-07
 * PURPOSE: Support Human ARC at a configurable hosting prefix within ARC Explainer.
 * SRP/DRY check: Pass — shared appPath helper keeps application and asset URLs consistent.
 */
import { appPath } from "@/utils/appPath";
export interface Trainer {
  id: string;
  name: string;
  rank: string;
  image: string;
  speciality?: string;
  type: 'trainer' | 'cadet' | 'officer';
}

export const TRAINERS: Trainer[] = [
  {
    id: 'wyatt',
    name: 'Wyatt',
    rank: 'Sergeant',
    image: appPath('/wyatt-space-force.jpg'),
    speciality: 'Basic Training',
    type: 'trainer'
  },
  {
    id: 'trainer1',
    name: 'Rodriguez',
    rank: 'Instructor',
    image: appPath('/Trainer1.PNG'),
    speciality: 'Communications',
    type: 'trainer'
  },
  {
    id: 'trainer2',
    name: 'Chen',
    rank: 'Staff Sergeant',
    image: appPath('/Trainer2.png'),
    speciality: 'Navigation Systems',
    type: 'trainer'
  },
  {
    id: 'trainer3',
    name: 'Thompson',
    rank: 'Technical Sergeant',
    image: appPath('/Trainer3.png'),
    speciality: 'Power Systems',
    type: 'trainer'
  }
];

export const CADETS: Trainer[] = [
  {
    id: 'fatma',
    name: 'Fatma',
    rank: 'Cadet',
    image: appPath('/Cadet-fatma.png'),
    type: 'cadet'
  },
  {
    id: 'yvonne',
    name: 'Yvonne',
    rank: 'Cadet',
    image: appPath('/Cadet-Yvonne.PNG'),
    type: 'cadet'
  }
];

export const OFFICERS: Trainer[] = [
  {
    id: 'wyatt-mc',
    name: 'Wyatt',
    rank: 'Master Chief',
    image: appPath('/master-chief-wyatt.png'),
    speciality: 'Advanced Operations',
    type: 'officer'
  },
  {
    id: 'yasemin',
    name: 'Yasemin',
    rank: 'Master Chief',
    image: appPath('/masterchief-yasemin.png'),
    speciality: 'Strategic Analysis',
    type: 'officer'
  },
  {
    id: 'divyapriya',
    name: 'Divyapriya',
    rank: 'Captain',
    image: appPath('/captain-divyapriya.PNG'),
    speciality: 'Flight Operations',
    type: 'officer'
  },
  {
    id: 'iki',
    name: 'Iki',
    rank: 'Captain',
    image: appPath('/captain-iki.png'),
    speciality: 'Tactical Systems',
    type: 'officer'
  },
  {
    id: 'luz',
    name: 'Luz',
    rank: 'Lieutenant Colonel',
    image: appPath('/ltcol-Luz.png'),
    speciality: 'Command Operations',
    type: 'officer'
  },
  {
    id: 'kim',
    name: 'Kim',
    rank: 'Colonel',
    image: appPath('/col-kim.png'),
    speciality: 'Strategic Command',
    type: 'officer'
  }
];

export const ALL_PERSONNEL = [...TRAINERS, ...CADETS, ...OFFICERS];

// Utility functions
export function getRandomTrainer(): Trainer {
  return TRAINERS[Math.floor(Math.random() * TRAINERS.length)];
}

export function getRandomCadet(): Trainer {
  return CADETS[Math.floor(Math.random() * CADETS.length)];
}

export function getRandomOfficer(): Trainer {
  return OFFICERS[Math.floor(Math.random() * OFFICERS.length)];
}

export function getPersonnelById(id: string): Trainer | undefined {
  return ALL_PERSONNEL.find(person => person.id === id);
}

export function getTrainerForTask(taskId: string): Trainer {
  // Use task ID to consistently assign the same trainer to the same task
  const hash = taskId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TRAINERS[hash % TRAINERS.length];
}

export function getOfficerForTrack(): Trainer {
  // Rotate through officers for variety
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return OFFICERS[dayOfYear % OFFICERS.length];
}
