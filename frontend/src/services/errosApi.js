import { idiomaAtual } from "../context/IdiomaContext";

// a API responde em português; a tela mostra a mensagem no idioma da bandeira
// cada linha: português (como vem da API), inglês, espanhol e francês
const LINHAS = [
  ["Não foi possível falar com o servidor. Confira se a API está rodando.", "Could not reach the server. Check that the API is running.", "No se pudo conectar con el servidor. Verifica que la API esté funcionando.", "Impossible de joindre le serveur. Vérifiez que l’API est lancée."],
  ["Algo deu errado. Tente de novo.", "Something went wrong. Please try again.", "Algo salió mal. Inténtalo de nuevo.", "Une erreur est survenue. Réessayez."],
  ["Dados inválidos", "Some of the details are not valid", "Algunos datos no son válidos", "Certaines informations ne sont pas valides"],
  ["Faça login para continuar", "Sign in to continue", "Inicia sesión para continuar", "Connectez-vous pour continuer"],
  ["Sessão inválida ou expirada. Faça login de novo.", "Your session has expired. Please sign in again.", "Tu sesión expiró. Inicia sesión de nuevo.", "Votre session a expiré. Veuillez vous reconnecter."],
  ["Você não tem permissão para fazer isso", "You don’t have permission to do this", "No tienes permiso para hacer esto", "Vous n’avez pas l’autorisation de faire cela"],
  ["Rota não encontrada", "Route not found", "Ruta no encontrada", "Route introuvable"],
  ["Erro interno no servidor", "Internal server error", "Error interno del servidor", "Erreur interne du serveur"],
  ["JSON inválido no corpo da requisição", "Invalid JSON in the request body", "JSON inválido en el cuerpo de la solicitud", "JSON invalide dans le corps de la requête"],

  ["E-mail ou senha incorretos", "Incorrect email or password", "Correo o contraseña incorrectos", "E-mail ou mot de passe incorrect"],
  ["Este e-mail já está cadastrado", "This email is already registered", "Este correo ya está registrado", "Cet e-mail est déjà enregistré"],
  ["E-mail inválido", "Invalid email", "Correo inválido", "E-mail invalide"],
  ["Informe a senha", "Enter your password", "Escribe tu contraseña", "Saisissez votre mot de passe"],
  ["A senha precisa ter pelo menos 6 caracteres", "Your password must be at least 6 characters long", "La contraseña debe tener al menos 6 caracteres", "Le mot de passe doit contenir au moins 6 caractères"],
  ["O nome precisa ter pelo menos 3 caracteres", "The name must be at least 3 characters long", "El nombre debe tener al menos 3 caracteres", "Le nom doit contenir au moins 3 caractères"],
  ["É preciso aceitar os termos de privacidade (LGPD)", "You need to accept the privacy terms (LGPD)", "Debes aceptar los términos de privacidad (LGPD)", "Vous devez accepter les conditions de confidentialité (LGPD)"],
  ["Idioma deve ser pt, en, es ou fr", "Language must be pt, en, es or fr", "El idioma debe ser pt, en, es o fr", "La langue doit être pt, en, es ou fr"],
  ["Informe pelo menos um idioma", "Choose at least one language", "Elige al menos un idioma", "Choisissez au moins une langue"],
  ["A foto é grande demais", "The photo is too large", "La foto es demasiado grande", "La photo est trop grande"],
  ["Foto inválida", "Invalid photo", "Foto inválida", "Photo invalide"],
  ["Nenhum campo para atualizar", "Nothing to update", "No hay nada para actualizar", "Rien à mettre à jour"],
  ["Perfil deve ser usuario ou voluntario", "Profile must be usuario or voluntario", "El perfil debe ser usuario o voluntario", "Le profil doit être usuario ou voluntario"],
  ["Usuário não encontrado", "User not found", "Usuario no encontrado", "Utilisateur introuvable"],
  ["CEP deve ter 8 números", "The postal code (CEP) must be 8 digits", "El código postal (CEP) debe tener 8 dígitos", "Le code postal (CEP) doit contenir 8 chiffres"],
  ["Estado deve ser a sigla com 2 letras", "Use the 2-letter state code", "Usa la sigla del estado, con 2 letras", "Indiquez l’État avec son sigle de 2 lettres"],

  ["Turno deve ser manha, tarde ou noite", "Time of day must be manha, tarde or noite", "El turno debe ser manha, tarde o noite", "La période doit être manha, tarde ou noite"],
  ["Área inválida", "Invalid area", "Área inválida", "Domaine invalide"],

  ["Voluntário não encontrado", "Volunteer not found", "Voluntario no encontrado", "Bénévole introuvable"],
  ["Voluntário precisa informar a área de atuação", "Volunteers must choose their area of expertise", "El voluntario debe indicar su área", "Le bénévole doit indiquer son domaine"],
  ["Só voluntários podem fazer isso", "Only volunteers can do this", "Solo los voluntarios pueden hacer esto", "Seuls les bénévoles peuvent faire cela"],
  ["Só voluntários têm dados profissionais", "Only volunteers have professional details", "Solo los voluntarios tienen datos profesionales", "Seuls les bénévoles ont des informations professionnelles"],
  ["Área não encontrada", "Area not found", "Área no encontrada", "Domaine introuvable"],
  ["Já existe uma área com esse nome", "An area with this name already exists", "Ya existe un área con ese nombre", "Un domaine porte déjà ce nom"],
  ["Não é possível excluir uma área que tem voluntários", "You can’t delete an area that has volunteers", "No se puede eliminar un área que tiene voluntarios", "Impossible de supprimer un domaine qui a des bénévoles"],
  ["Serviço não encontrado", "Service not found", "Servicio no encontrado", "Service introuvable"],
  ["O título precisa ter pelo menos 3 caracteres", "The title must be at least 3 characters long", "El título debe tener al menos 3 caracteres", "Le titre doit contenir au moins 3 caractères"],
  ["A descrição precisa ter pelo menos 10 caracteres", "The description must be at least 10 characters long", "La descripción debe tener al menos 10 caracteres", "La description doit contenir au moins 10 caractères"],
  ["Duração mínima de 15 minutos", "The minimum length is 15 minutes", "La duración mínima es de 15 minutos", "La durée minimale est de 15 minutes"],
  ["Duração máxima de 180 minutos", "The maximum length is 180 minutes", "La duración máxima es de 180 minutos", "La durée maximale est de 180 minutes"],
  ["Serviço inválido", "Invalid service", "Servicio inválido", "Service invalide"],
  ["O serviço tem agendamentos, por isso foi desativado em vez de excluído", "This service has appointments, so it was deactivated instead of deleted", "Este servicio tiene citas, así que se desactivó en lugar de eliminarse", "Ce service a des rendez-vous : il a été désactivé au lieu d’être supprimé"],

  ["Horário não encontrado", "Time slot not found", "Horario no encontrado", "Créneau introuvable"],
  ["Horário inválido", "Invalid time slot", "Horario inválido", "Créneau invalide"],
  ["Data deve estar no formato AAAA-MM-DD", "Date must be in the YYYY-MM-DD format", "La fecha debe tener el formato AAAA-MM-DD", "La date doit être au format AAAA-MM-JJ"],
  ["Data inválida", "Invalid date", "Fecha inválida", "Date invalide"],
  ["Hora deve estar no formato HH:MM", "Time must be in the HH:MM format", "La hora debe tener el formato HH:MM", "L’heure doit être au format HH:MM"],
  ["A hora de fim precisa ser depois da hora de início", "The end time must be after the start time", "La hora de fin debe ser después de la hora de inicio", "L’heure de fin doit être après l’heure de début"],
  ["Não é possível criar horário no passado", "You can’t create a time slot in the past", "No se puede crear un horario en el pasado", "Impossible de créer un créneau dans le passé"],
  ["Já existe um horário nesse período na sua agenda", "You already have a time slot in this period", "Ya tienes un horario en ese período", "Vous avez déjà un créneau sur cette période"],
  ["Só é possível editar horários livres", "Only open time slots can be edited", "Solo se pueden editar horarios libres", "Seuls les créneaux libres peuvent être modifiés"],
  ["Este horário já tem um agendamento. Confirme para excluir mesmo assim.", "This time slot already has an appointment. Confirm to delete it anyway.", "Este horario ya tiene una cita. Confirma para eliminarlo de todos modos.", "Ce créneau a déjà un rendez-vous. Confirmez pour le supprimer quand même."],
  ["Status deve ser livre ou reservado", "Status must be livre or reservado", "El estado debe ser livre o reservado", "Le statut doit être livre ou reservado"],

  ["Agendamento não encontrado", "Appointment not found", "Cita no encontrada", "Rendez-vous introuvable"],
  ["Este horário já passou. Escolha outro.", "This time has already passed. Choose another one.", "Este horario ya pasó. Elige otro.", "Ce créneau est déjà passé. Choisissez-en un autre."],
  ["Este horário acabou de ser reservado. Escolha outro.", "This time slot was just booked. Choose another one.", "Este horario acaba de ser reservado. Elige otro.", "Ce créneau vient d’être réservé. Choisissez-en un autre."],
  ["Este serviço não é oferecido pelo voluntário deste horário", "The volunteer for this time slot doesn’t offer this service", "El voluntario de este horario no ofrece este servicio", "Le bénévole de ce créneau ne propose pas ce service"],
  ["Descreva o que você precisa com pelo menos 20 caracteres", "Describe what you need in at least 20 characters", "Describe lo que necesitas con al menos 20 caracteres", "Décrivez votre besoin en au moins 20 caractères"],
  ["Só usuários podem marcar atendimentos", "Only users can book appointments", "Solo los usuarios pueden reservar citas", "Seuls les utilisateurs peuvent réserver un rendez-vous"],
  ["Você não tem acesso a este agendamento", "You don’t have access to this appointment", "No tienes acceso a esta cita", "Vous n’avez pas accès à ce rendez-vous"],
  ["Você só pode alterar o que é seu", "You can only change what is yours", "Solo puedes cambiar lo que es tuyo", "Vous ne pouvez modifier que ce qui vous appartient"],
  ["Só é possível alterar agendamentos confirmados", "Only confirmed appointments can be changed", "Solo se pueden cambiar citas confirmadas", "Seuls les rendez-vous confirmés peuvent être modifiés"],
  ["Só é possível cancelar agendamentos confirmados", "Only confirmed appointments can be cancelled", "Solo se pueden cancelar citas confirmadas", "Seuls les rendez-vous confirmés peuvent être annulés"],
  ["Só é possível remarcar com o mesmo voluntário", "You can only reschedule with the same volunteer", "Solo puedes reprogramar con el mismo voluntario", "Vous ne pouvez reprogrammer qu’avec le même bénévole"],
  ["Só quem marcou o atendimento pode remarcar ou mudar a descrição", "Only the person who booked can reschedule or change the description", "Solo quien reservó puede reprogramar o cambiar la descripción", "Seule la personne qui a réservé peut reprogrammer ou modifier la description"],
  ["Só o voluntário escreve a anotação do atendimento", "Only the volunteer can write the appointment notes", "Solo el voluntario puede escribir la nota de la cita", "Seul le bénévole peut rédiger la note du rendez-vous"],
  ["Só o voluntário pode marcar o atendimento como realizado", "Only the volunteer can mark the appointment as completed", "Solo el voluntario puede marcar la cita como realizada", "Seul le bénévole peut marquer le rendez-vous comme effectué"],
  ["A anotação pode ter até 1000 caracteres", "Notes can be up to 1000 characters long", "La nota puede tener hasta 1000 caracteres", "La note peut contenir jusqu’à 1000 caractères"],
  ["Status deve ser confirmado, cancelado ou realizado", "Status must be confirmado, cancelado or realizado", "El estado debe ser confirmado, cancelado o realizado", "Le statut doit être confirmado, cancelado ou realizado"],
  ["Para cancelar use DELETE. Aqui o status só pode ser realizado", "To cancel, use DELETE. Here the status can only be realizado", "Para cancelar usa DELETE. Aquí el estado solo puede ser realizado", "Pour annuler, utilisez DELETE. Ici le statut ne peut être que realizado"],
  ["Id inválido", "Invalid ID", "Id inválido", "Id invalide"],
  ["Você já tem um atendimento nesse horário", "You already have an appointment at this time", "Ya tienes una cita en ese horario", "Vous avez déjà un rendez-vous à cet horaire"],
  ["A videochamada só existe para atendimentos confirmados", "Video calls are only available for confirmed appointments", "La videollamada solo está disponible para citas confirmadas", "L’appel vidéo n’est disponible que pour les rendez-vous confirmés"],
  ["A videochamada não está configurada neste servidor", "Video calls are not set up on this server", "La videollamada no está configurada en este servidor", "L’appel vidéo n’est pas configuré sur ce serveur"],
  ["Não foi possível criar a sala da videochamada. Tente de novo.", "Couldn’t create the video call room. Please try again.", "No se pudo crear la sala de la videollamada. Inténtalo de nuevo.", "Impossible de créer la salle de l’appel vidéo. Réessayez."],
];

// campo sem mensagem própria no schema recebe a mensagem padrão do Zod 4, que vem em inglês.
// Só os formatos do Zod casam aqui: "Invalid email", que é a nossa tradução, não vira "Invalid value"
const PADROES_ZOD = [
  [/^Too big: expected string to have <=(\d+) characters$/, (n) => [`Pode ter até ${n} caracteres`, `Must be ${n} characters or fewer`, `Puede tener hasta ${n} caracteres`, `Ne doit pas dépasser ${n} caractères`]],
  [
    /^(Invalid input(: |$)|Invalid option: |Invalid (string|number): |Invalid (key|value) in |Invalid discriminator value\. |Invalid (email address|URL|UUID|ISO (date|datetime|time|duration))$|Too (big|small): expected |Unrecognized keys?: )/,
    () => ["Valor inválido", "Invalid value", "Valor inválido", "Valeur invalide"],
  ],
];

const COLUNA = { pt: 0, en: 1, es: 2, fr: 3 };
const MAPA = new Map(LINHAS.map((linha) => [linha[0], linha]));

// recebe só a mensagem como a API mandou; a que não está na lista continua como veio
export function traduzirErroApi(mensagem) {
  if (!mensagem) return mensagem;
  const coluna = COLUNA[idiomaAtual()] ?? 0;
  const linha = MAPA.get(mensagem);
  if (linha) return linha[coluna];
  for (const [regra, textos] of PADROES_ZOD) {
    const achou = mensagem.match(regra);
    if (achou) return textos(achou[1])[coluna];
  }
  return mensagem;
}

// a tela guarda a mensagem crua e traduz na hora de mostrar, para ela trocar junto com a bandeira:
// chave dos textos da tela (validação), [chave, valor] para texto com número, ou o erro como a API mandou
export function traduzirMensagem(valor, textos) {
  if (!valor) return valor;
  if (Array.isArray(valor)) {
    const [chave, ...valores] = valor;
    return textos[chave](...valores);
  }
  return textos[valor] ?? traduzirErroApi(valor);
}
