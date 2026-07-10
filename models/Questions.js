const QuestionsSchema = new mongoose.Schema({
  title: {
    type: String,
    default: ""
  },

  description: {
    type: String,
    default: ""
  },

  question: {
    type: String,
    required: true
  },

  instructions: {
    type: String,
    default: ""
  },

  dueDate: {
    type: Date,
    default: null
  },

  maxScore: {
    type: Number,
    default: 100
  },

  options: {
    type: [OptionSchema],
    default: []
  },

  answer: {
    type: String,
    default: ""
  },

  explanation: {
    type: String,
    default: ""
  },

  questionImage: {
    type: String,
    default: ""
  },

  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course"
  },

  type: {
    type: String,
    default: "multiple_choice"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

export default mongoose.models.Questions || mongoose.model("Questions", QuestionsSchema);
