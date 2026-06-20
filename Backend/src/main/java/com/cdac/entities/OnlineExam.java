package com.cdac.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "online_exam")
@Getter
@Setter
public class OnlineExam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(nullable = false)
    private String subject;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "online_exam_choices",joinColumns = @JoinColumn(name = "online_exam_id"))
    @Column(name = "choice")
    private List<String> choices;

    @Column(name = "correct_answer", nullable = false)
    private String correctAnswer;
}
