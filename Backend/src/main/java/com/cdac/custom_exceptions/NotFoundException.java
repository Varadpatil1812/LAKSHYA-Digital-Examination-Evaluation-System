package com.cdac.custom_exceptions;

public class NotFoundException extends RuntimeException {

    private static final long serialVersionUID = -1659082629697110683L;

	public NotFoundException(String message) {
        super(message);
    }
}
