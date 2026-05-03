const USERS_KEY = "bvom_users";
const CURRENT_USER_KEY = "bvom_current_user";

function getUsers() {
  const rawUsers = localStorage.getItem(USERS_KEY);

  if (!rawUsers) {
    return [];
  }

  try {
    return JSON.parse(rawUsers);
  } catch {
    localStorage.removeItem(USERS_KEY);
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function signUpUser({ displayName, username, password, cohortCode }) {
  const users = getUsers();

  const existingUser = users.find(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );

  if (existingUser) {
    throw new Error("This username already exists.");
  }

  const newUser = {
    id: crypto.randomUUID(),
    displayName,
    username,
    password,
    cohortCode,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  return newUser;
}

export function signInUser(username, password) {
  const users = getUsers();

  const user = users.find(
    (existingUser) =>
      existingUser.username.toLowerCase() === username.toLowerCase() &&
      existingUser.password === password
  );

  if (!user) {
    throw new Error("Invalid username or password.");
  }

  const currentUser = {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    cohortCode: user.cohortCode,
    signedInAt: new Date().toISOString()
  };

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));

  return currentUser;
}

export function getCurrentUser() {
  const rawUser = localStorage.getItem(CURRENT_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}