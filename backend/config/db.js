import mongoose from "mongoose";


const connectDB = async () => {
	// Prefer explicit MONGO_URI. If missing, build from parts to avoid manual encoding errors.
	let uri = process.env.MONGO_URI;
	let builtFromParts = false;
	if (!uri) {
		const user = process.env.MONGO_USER;
		const pass = process.env.MONGO_PASS;
		const host = process.env.MONGO_HOST; // e.g. cluster0.lrzqv77.mongodb.net
		const db = process.env.MONGO_DB || 'vn_dairy';
		if (user && pass && host) {
			const encPass = encodeURIComponent(pass);
			uri = `mongodb+srv://${user}:${encPass}@${host}/${db}?retryWrites=true&w=majority&appName=Cluster0`;
			builtFromParts = true;
			console.log('Built MONGO_URI from MONGO_USER/MONGO_PASS/MONGO_HOST');
		}
	}

	if (!uri) throw new Error("MONGO_URI not set in environment and MONGO_USER/MONGO_PASS/MONGO_HOST not provided");

	try {
		await mongoose.connect(uri, {
			// these options are current defaults in modern mongoose but kept for clarity
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		// Determine a host string to print (masked)
		let hostToShow = process.env.MONGO_HOST;
		if (!hostToShow) {
			const m = uri.match(/@([^/]+)/);
			hostToShow = m ? m[1] : uri.replace('mongodb://', '').replace('mongodb+srv://', '').split('/')[0].split(':')[0];
		}
		console.log(`MongoDB connected to ${hostToShow}`);
		if (builtFromParts) console.log('(MONGO_URI was constructed from env parts)');
	} catch (err) {
		console.error('MongoDB connection error ', err && err.message ? err.message : err);
		process.exit(1);
	}
};


export default connectDB;