const express = require("express");
const Joi = require("joi");
const {
  getTasks,
  addTask,
  updateTask,
  updateStatus,
  removeTask
} = require("../services/tasksService");

const router = express.Router();

const taskCreateSchema = Joi.object({ //validacja
  title: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .messages({
      "string.empty": "Pavadinimas yra privalomas",
      "string.min": "Pavadinimas turi būti bent 1 simbolis",
      "string.max": "Pavadinime turi būti ne daugiau kaip 200 simbolių"
    }),
  due_date: Joi.string().allow("").optional(),
  email: Joi.string().email().allow("").optional().messages({
    "string.email": "El. paštas turi būti validus"
  })
});

const taskUpdateSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .messages({
      "string.min": "Pavadinimas turi būti bent 1 simbolis",
      "string.max": "Pavadinime turi būti ne daugiau kaip 200 simbolių"
    }),
  due_date: Joi.string().allow(""),
  email: Joi.string().email().allow("").messages({
    "string.email": "El. paštas turi būti validus"
  }),
  status: Joi.string().valid("pending", "done").messages({
    "any.only": "Status turi būti pending arba done"
  }),
  reminder_sent: Joi.boolean()
}).min(1).messages({
  "object.min": "Bent vienas laukas yra privalomas"
});

const statusSchema = Joi.object({ //patch metodui labiau
  status: Joi.string().valid("pending", "done").required().messages({
    "any.only": "Status turi būti pending arba done",
    "string.empty": "Status yra privalomas"
  })
});

const querySchema = Joi.object({
  status: Joi.string().valid("pending", "done").messages({
    "any.only": "Status turi būti pending arba done"
  }),
  due_date: Joi.string().allow("")
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "ID turi būti skaičius",
    "number.integer": "ID turi būti sveikas skaičius",
    "number.positive": "ID turi būti teigiamas skaičius",
    "any.required": "ID yra privalomas"
  })
});

function validateBody(schema) {
  return (req, res, next) => { 
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false, //tikrina visus laukus ne tik pirma klaid
      stripUnknown: true //pasalina laukus, kurie nera apibrezti schemoje
    });

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map(detail => detail.message)
      });
    }

    req.body = value;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map(detail => detail.message)
      });
    }

    req.query = value;
    next();
  };
}

function validateParams(schema) { 
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false, 
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map(detail => detail.message)
      });
    }

    req.params = value;
    next();
  };
} //funkcijos validacijai, kad nereiktu kartoti kodo kiekvienam route

router.get("/", validateQuery(querySchema), (req, res) => {
  const tasks = getTasks(req.query);
  res.json(tasks);
}); //gauti

router.post("/", validateBody(taskCreateSchema), (req, res) => {
  const task = addTask(req.body); //siunciam duomenis is body i addTask funkcija
  res.json(task); 
}); //kurti

router.put("/:id", validateParams(idParamSchema), validateBody(taskUpdateSchema), (req, res) => {
  updateTask(req.params.id, req.body);
  res.json({ message: "Updated" });
}); //atnaujinti

router.patch("/:id/status", validateParams(idParamSchema), validateBody(statusSchema), (req, res) => {
  updateStatus(req.params.id, req.body.status);
  res.json({ message: "Status updated" });
}); //atnaujinti tik statusa

router.delete("/:id", validateParams(idParamSchema), (req, res) => {
  removeTask(req.params.id);
  res.json({ message: "Deleted" });
}); //istrinti

module.exports = router;
