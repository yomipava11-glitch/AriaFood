import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Configure et demande les autorisations natives Android pour les notifications
 */
export const setupNotifications = async () => {
    if (Capacitor.getPlatform() === 'web') return false; // Ne fonctionne que sur le téléphone

    try {
        let permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== 'granted') {
            permStatus = await LocalNotifications.requestPermissions();
        }
        return permStatus.display === 'granted';
    } catch (e) {
        console.warn("Notifications non supportées sur cet appareil (Navigateur web)", e);
        return false;
    }
};

/**
 * Automatise des rappels d'eau quotidiens à des heures clés
 */
export const scheduleHydrationReminder = async () => {
    const hasPermission = await setupNotifications();
    if (!hasPermission) return;

    try {
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: "💧 AriaFood : C'est le matin !",
                    body: "Commence ta journée en t'hydratant. Prends un grand verre d'eau fraîchce.",
                    id: 101, // ID unique pour Android
                    schedule: { on: { hour: 8, minute: 30 } }, // Tous les jours à 8h30
                },
                {
                    title: "💧 AriaFood : Pause Hydratation",
                    body: "Ton métabolisme a besoin d'eau pour brûler des calories ! Pense à boire.",
                    id: 102,
                    schedule: { on: { hour: 14, minute: 0 } }, // Tous les jours à 14h
                },
                {
                    title: "💧 AriaFood : Fin de journée",
                    body: "Dernière ligne droite ! Un dernier verre avant le souper. Santé !",
                    id: 103,
                    schedule: { on: { hour: 19, minute: 15 } }, // Tous les jours à 19h15
                }
            ]
        });
        console.log("[NOTIFICATIONS] Hydratation programmée avec succès");
    } catch(e) {
        console.error("Erreur Hydratation Schedule", e);
    }
};

/**
 * Calcule et planifie l'alerte prédictive des menstruations (2 jours avant)
 */
export const scheduleCycleReminder = async (nextPeriodInDays: number) => {
    const hasPermission = await setupNotifications();
    if (!hasPermission) return;

    try {
        // Enlève l'ancien rappel si l'utilisatrice a modifié sa date de règles
        await LocalNotifications.cancel({ notifications: [{ id: 200 }] });

        // On crée l'alerte seulement s'il reste plus de 2 jours
        if (nextPeriodInDays > 2) {
            const scheduleDate = new Date();
            scheduleDate.setDate(scheduleDate.getDate() + (nextPeriodInDays - 2));
            scheduleDate.setHours(9, 0, 0, 0); // La planifie à 9h du matin

            // Vérifie que la date est bien dans le futur
            if (scheduleDate.getTime() > Date.now()) {
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: "🌸 AriaCycle : Bientôt",
                            body: "Tes prochaines règles devraient arriver dans environ 2 jours. Pense à t'y préparer.",
                            id: 200,
                            schedule: { at: scheduleDate },
                        }
                    ]
                });
                console.log("[NOTIFICATIONS] Alerte cycle programmée pour", scheduleDate);
            }
        }
    } catch(e) {
        console.error("Erreur Cycle Schedule", e);
    }
};
