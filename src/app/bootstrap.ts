import { runBootLoader } from "@app/bootloader";
import { startApp } from "@app/start";

export const bootstrapApp = async (): Promise<void> => {
	startApp();
	await runBootLoader();
};
