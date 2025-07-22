// userController.js
const { generateInvitationCode } = require('../utils/utils');

async function registerUser(req, res) {
  const { email, password, invitedByCode } = req.body;

  // Lógica para verificar que el código de invitación es válido...
  // Aquí usaríamos la función para generar el código de invitación

  const invitationCode = generateInvitationCode();

  try {
    const newUser = await prisma.user.create({
      data: {
        email,
        password,
        invitationCode,  // Asignar código de invitación generado
        invitedByCode,   // Código de invitación de quien invitó
      },
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear usuario.' });
  }
}

module.exports = { registerUser };
