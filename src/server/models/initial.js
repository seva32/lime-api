export default async (Role) => {
  try {
    const count = await Role.estimatedDocumentCount(); // Use await to handle async function

    if (count === 0) {
      // Use create instead of new + save
      await Role.create({ name: "user" });
      console.log("added 'user' to roles collection");

      await Role.create({ name: "moderator" });
      console.log("added 'moderator' to roles collection");

      await Role.create({ name: "admin" });
      console.log("added 'admin' to roles collection");
    }
  } catch (err) {
    console.log("Error initializing roles:", err);
  }
};
