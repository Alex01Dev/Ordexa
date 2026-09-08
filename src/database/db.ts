import * as SQLite from 'expo-sqlite';

// Abre (o crea) la base de datos local en el dispositivo
export const db = SQLite.openDatabaseSync('ordexa.db');